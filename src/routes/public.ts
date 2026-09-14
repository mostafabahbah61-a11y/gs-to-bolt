import { Hono } from 'hono'
import type { AppEnv } from '../lib/types'
import { getContentBundle } from '../lib/content'
import { forwardToSheet, nowIso } from '../lib/sheet-sync'

const publicApi = new Hono<AppEnv>()

// ---- Aggregated content for the public site (bilingual) ----
publicApi.get('/content', async (c) => {
  const bundle = await getContentBundle(c.env.DB)
  return c.json(bundle)
})

// ---- Contact form submission ----
// Saved to D1 (source of truth) and forwarded to the Google Sheet webhook
// as a best-effort, non-blocking background task. The webhook URL is a
// server-side-only secret (GAS_WEBHOOK_URL) — never exposed to the browser.
publicApi.post('/contact', async (c) => {
  const { DB } = c.env
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid request body' }, 400)

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
  const emailPhone =
    typeof body.emailPhone === 'string' ? body.emailPhone.trim().slice(0, 200) : ''
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : ''
  const lang = body.lang === 'ar' ? 'ar' : 'en'

  if (!name || !emailPhone || !message) {
    return c.json({ error: 'Name, Email/Phone and Message are required.' }, 400)
  }

  const result = await DB.prepare(
    'INSERT INTO contact_messages (name, email_phone, message, lang) VALUES (?, ?, ?, ?)'
  )
    .bind(name, emailPhone, message, lang)
    .run()

  const id = result.meta.last_row_id
  const dateTime = nowIso()

  // Fire-and-forget sync to Google Sheet — does not block or fail the response.
  c.executionCtx.waitUntil(
    (async () => {
      const ok = await forwardToSheet(c.env, {
        formType: 'contact',
        name,
        emailPhone,
        message,
        rating: '',
        dateTime,
      })
      if (ok) {
        await DB.prepare('UPDATE contact_messages SET sheet_synced = 1 WHERE id = ?')
          .bind(id)
          .run()
          .catch(() => {})
      }
    })()
  )

  return c.json({ success: true })
})

// ---- Feedback submission ----
publicApi.post('/feedback', async (c) => {
  const { DB } = c.env
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid request body' }, 400)

  const message = typeof body.message === 'string' ? body.message.slice(0, 4000) : ''
  const emoji = typeof body.emoji === 'string' ? body.emoji.slice(0, 16) : ''
  const lang = body.lang === 'ar' ? 'ar' : 'en'
  const voiceR2Key = typeof body.voiceR2Key === 'string' ? body.voiceR2Key : null
  const voiceUrl = typeof body.voiceUrl === 'string' ? body.voiceUrl : null
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
  const emailPhone =
    typeof body.emailPhone === 'string' ? body.emailPhone.trim().slice(0, 200) : ''

  if (!message && !emoji && !voiceR2Key) {
    return c.json({ error: 'Feedback must include a message, emoji or voice note.' }, 400)
  }

  const result = await DB.prepare(
    'INSERT INTO feedback (message, emoji, voice_r2_key, voice_url, lang, name, email_phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(message, emoji, voiceR2Key, voiceUrl, lang, name, emailPhone)
    .run()

  const id = result.meta.last_row_id
  const dateTime = nowIso()

  // Fire-and-forget sync to Google Sheet — does not block or fail the response.
  c.executionCtx.waitUntil(
    (async () => {
      const ok = await forwardToSheet(c.env, {
        formType: 'feedback',
        name,
        emailPhone,
        message: voiceUrl ? `${message} [voice note: ${voiceUrl}]`.trim() : message,
        rating: emoji,
        dateTime,
      })
      if (ok) {
        await DB.prepare('UPDATE feedback SET sheet_synced = 1 WHERE id = ?')
          .bind(id)
          .run()
          .catch(() => {})
      }
    })()
  )

  return c.json({ success: true })
})

// ---- Voice note upload (public, used by feedback widget) ----
publicApi.post('/feedback/voice', async (c) => {
  const { R2 } = c.env
  const contentType = c.req.header('content-type') || 'audio/webm'
  const buf = await c.req.arrayBuffer()

  if (buf.byteLength === 0) {
    return c.json({ error: 'Empty audio file' }, 400)
  }
  // 5MB safety cap for voice feedback notes
  if (buf.byteLength > 5 * 1024 * 1024) {
    return c.json({ error: 'Audio file too large (max 5MB)' }, 413)
  }

  const ext = contentType.includes('mp4') ? 'm4a' : contentType.includes('ogg') ? 'ogg' : 'webm'
  const key = `feedback-voice/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  await R2.put(key, buf, { httpMetadata: { contentType } })

  return c.json({ r2Key: key, url: `/media/${key}` })
})

export default publicApi
