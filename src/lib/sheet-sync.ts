// Server-side only helper that forwards Contact / Feedback submissions to the
// Google Apps Script Web App webhook, which appends a row to a Google Sheet.
//
// SECURITY NOTE: The webhook URL (and any Google credentials) live only in the
// Cloudflare Worker environment (GAS_WEBHOOK_URL secret) and are never exposed
// to the browser. The frontend only ever talks to our own /api/* endpoints.
//
// RELIABILITY NOTE: Sheet sync is best-effort and non-blocking for the visitor
// — every submission is saved to D1 first (source of truth), then a fire-and
// -forget forward is attempted to the sheet. If Google is unreachable or
// rejects the request, the visitor's submission is NOT lost: it stays in D1
// and is visible/manageable from the Admin Dashboard regardless of sheet
// sync outcome.

import type { Bindings } from './types'

export type SheetRow = {
  formType: 'contact' | 'feedback'
  name: string
  emailPhone: string
  message: string
  rating: string // emoji / rating, empty string for contact form
  dateTime: string // ISO 8601, generated server-side
}

/**
 * Fire off the row to the configured Google Apps Script webhook.
 * Returns true only if the script actually executed and reported success.
 *
 * IMPORTANT: Google Apps Script error pages (e.g. "You do not have
 * permission to access the requested document", or "Script function not
 * found: doPost") are served with HTTP 200 and Content-Type: text/html —
 * a naive `res.ok` check would treat those as successes. A correctly
 * deployed Apps Script Web App that uses `ContentService.createTextOutput(
 * JSON.stringify(...)).setMimeType(ContentService.MimeType.JSON)` returns
 * `application/json`, so we require that content-type AND a truthy
 * `success`/`ok`/`status==="ok"` field in the parsed body before treating
 * the sync as successful. Anything else (HTML error page, redirect to a
 * Google login/consent screen, network failure, timeout) is treated as a
 * failure — the visitor's submission is still safely stored in D1 either
 * way, and can be retried from the Admin Dashboard.
 *
 * Never throws — all errors are caught and logged so a Sheet outage can
 * never break the visitor-facing Contact/Feedback flow.
 */
export async function forwardToSheet(env: Bindings, row: SheetRow): Promise<boolean> {
  const url = env.GAS_WEBHOOK_URL
  if (!url) {
    // Not configured — silently skip (D1 already has the record).
    return false
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error('sheet-sync: webhook returned non-2xx status', res.status)
      return false
    }

    const contentType = res.headers.get('content-type') || ''
    const bodyText = await res.text()

    // Google's own error pages (permission errors, missing doPost, auth
    // walls) are HTML, not JSON — reject those outright regardless of the
    // HTTP status code.
    if (!contentType.includes('application/json')) {
      console.error(
        'sheet-sync: webhook did not return JSON (got',
        contentType || 'unknown content-type',
        ') — likely a Google Apps Script deployment/permission error. Body preview:',
        bodyText.slice(0, 300)
      )
      return false
    }

    let parsed: any
    try {
      parsed = JSON.parse(bodyText)
    } catch {
      console.error('sheet-sync: webhook body was not valid JSON despite JSON content-type')
      return false
    }

    const isSuccess =
      parsed?.success === true || parsed?.ok === true || parsed?.status === 'ok' || parsed?.result === 'success'

    if (!isSuccess) {
      console.error('sheet-sync: webhook responded without a success indicator', parsed)
      return false
    }

    return true
  } catch (err) {
    console.error('sheet-sync: failed to forward row to Google Sheet', err)
    return false
  }
}

export function nowIso(): string {
  return new Date().toISOString()
}
