import type { Bindings } from './types'

export type ContentBundle = {
  content: Record<string, Record<string, { en: string; ar: string }>>
  projects: Array<{
    id: number
    name_en: string
    name_ar: string
    category_en: string
    category_ar: string
    url: string
    qr_image_url: string
  }>
  services: Array<{ id: number; title_en: string; title_ar: string; icon: string }>
  processSteps: Array<{ id: number; title_en: string; title_ar: string }>
  whyHighlights: Array<{
    id: number
    title_en: string
    title_ar: string
    text_en: string
    text_ar: string
    icon: string
  }>
  socialLinks: Array<{ id: number; platform: string; label: string; url: string; icon: string }>
  settings: Record<string, string>
}

export async function getContentBundle(DB: Bindings['DB']): Promise<ContentBundle> {
  const [contentBlocks, projects, services, processSteps, whyHighlights, socialLinks, settingsRows] =
    await Promise.all([
      DB.prepare(
        'SELECT section, field, value_en, value_ar FROM content_blocks ORDER BY section, sort_order'
      ).all(),
      DB.prepare(
        'SELECT id, name_en, name_ar, category_en, category_ar, url, qr_image_url FROM projects WHERE is_active = 1 ORDER BY sort_order'
      ).all(),
      DB.prepare(
        'SELECT id, title_en, title_ar, icon FROM services WHERE is_active = 1 ORDER BY sort_order'
      ).all(),
      DB.prepare(
        'SELECT id, title_en, title_ar FROM process_steps WHERE is_active = 1 ORDER BY sort_order'
      ).all(),
      DB.prepare(
        'SELECT id, title_en, title_ar, text_en, text_ar, icon FROM why_highlights WHERE is_active = 1 ORDER BY sort_order'
      ).all(),
      DB.prepare(
        'SELECT id, platform, label, url, icon FROM social_links WHERE is_active = 1 ORDER BY sort_order'
      ).all(),
      DB.prepare('SELECT key, value FROM settings').all(),
    ])

  const content: ContentBundle['content'] = {}
  for (const row of contentBlocks.results as any[]) {
    if (!content[row.section]) content[row.section] = {}
    content[row.section][row.field] = { en: row.value_en, ar: row.value_ar }
  }

  const settings: Record<string, string> = {}
  for (const row of settingsRows.results as any[]) {
    settings[row.key] = row.value
  }

  return {
    content,
    projects: projects.results as any,
    services: services.results as any,
    processSteps: processSteps.results as any,
    whyHighlights: whyHighlights.results as any,
    socialLinks: socialLinks.results as any,
    settings,
  }
}

// Safe getter with fallback so missing DB rows never break rendering
export function t(
  bundle: ContentBundle,
  section: string,
  field: string,
  lang: 'en' | 'ar',
  fallback = ''
): string {
  return bundle.content[section]?.[field]?.[lang] ?? fallback
}
