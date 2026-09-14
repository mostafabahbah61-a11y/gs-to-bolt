import { Hono } from 'hono'
import type { AppEnv } from '../lib/types'
import { requireAdmin } from '../lib/admin-middleware'
import { forwardToSheet, nowIso } from '../lib/sheet-sync'

const adminApi = new Hono<AppEnv>()
adminApi.use('/*', requireAdmin)

// ============ Whoami ============
adminApi.get('/me', (c) => c.json({ username: c.get('adminUsername') }))

// ============ Content blocks (bilingual key/value per section) ============
adminApi.get('/content', async (c) => {
  const { DB } = c.env
  const rows = await DB.prepare(
    'SELECT id, section, field, value_en, value_ar, sort_order FROM content_blocks ORDER BY section, sort_order'
  ).all()
  return c.json({ items: rows.results })
})

adminApi.put('/content/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid body' }, 400)
  const valueEn = String(body.value_en ?? '')
  const valueAr = String(body.value_ar ?? '')

  await c.env.DB.prepare(
    'UPDATE content_blocks SET value_en = ?, value_ar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )
    .bind(valueEn, valueAr, id)
    .run()

  return c.json({ success: true })
})

// ============ Projects ============
adminApi.get('/projects', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order').all()
  return c.json({ items: rows.results })
})

adminApi.post('/projects', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b?.name_en || !b?.url) return c.json({ error: 'name_en and url are required' }, 400)

  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM projects').first<{ m: number }>()
  const nextSort = (maxRow?.m ?? -1) + 1

  const result = await c.env.DB.prepare(
    `INSERT INTO projects (name_en, name_ar, category_en, category_ar, url, qr_image_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  )
    .bind(
      b.name_en, b.name_ar || '', b.category_en || '', b.category_ar || '',
      b.url, b.qr_image_url || '', nextSort
    )
    .run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

adminApi.put('/projects/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ error: 'Invalid body' }, 400)

  await c.env.DB.prepare(
    `UPDATE projects SET name_en=?, name_ar=?, category_en=?, category_ar=?, url=?, qr_image_url=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  )
    .bind(
      b.name_en || '', b.name_ar || '', b.category_en || '', b.category_ar || '',
      b.url || '', b.qr_image_url || '', b.is_active === false ? 0 : 1, id
    )
    .run()

  return c.json({ success: true })
})

adminApi.put('/projects/:id/reorder', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  const direction = b?.direction === 'up' ? -1 : 1
  await reorder(c.env.DB, 'projects', id, direction)
  return c.json({ success: true })
})

adminApi.delete('/projects/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

// ============ Services ============
adminApi.get('/services', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM services ORDER BY sort_order').all()
  return c.json({ items: rows.results })
})

adminApi.post('/services', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b?.title_en) return c.json({ error: 'title_en is required' }, 400)
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM services').first<{ m: number }>()
  const nextSort = (maxRow?.m ?? -1) + 1
  const result = await c.env.DB.prepare(
    'INSERT INTO services (title_en, title_ar, icon, sort_order, is_active) VALUES (?, ?, ?, ?, 1)'
  )
    .bind(b.title_en, b.title_ar || '', b.icon || 'fa-solid fa-star', nextSort)
    .run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

adminApi.put('/services/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ error: 'Invalid body' }, 400)
  await c.env.DB.prepare(
    'UPDATE services SET title_en=?, title_ar=?, icon=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  )
    .bind(b.title_en || '', b.title_ar || '', b.icon || '', b.is_active === false ? 0 : 1, id)
    .run()
  return c.json({ success: true })
})

adminApi.delete('/services/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

adminApi.put('/services/:id/reorder', async (c) => {
  const b = await c.req.json().catch(() => null)
  await reorder(c.env.DB, 'services', c.req.param('id'), b?.direction === 'up' ? -1 : 1)
  return c.json({ success: true })
})

// ============ Why highlights ============
adminApi.get('/why', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM why_highlights ORDER BY sort_order').all()
  return c.json({ items: rows.results })
})

adminApi.post('/why', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b?.title_en) return c.json({ error: 'title_en is required' }, 400)
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM why_highlights').first<{ m: number }>()
  const nextSort = (maxRow?.m ?? -1) + 1
  const result = await c.env.DB.prepare(
    'INSERT INTO why_highlights (title_en, title_ar, text_en, text_ar, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
  )
    .bind(b.title_en, b.title_ar || '', b.text_en || '', b.text_ar || '', b.icon || 'fa-solid fa-star', nextSort)
    .run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

adminApi.put('/why/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ error: 'Invalid body' }, 400)
  await c.env.DB.prepare(
    'UPDATE why_highlights SET title_en=?, title_ar=?, text_en=?, text_ar=?, icon=?, is_active=? WHERE id=?'
  )
    .bind(b.title_en || '', b.title_ar || '', b.text_en || '', b.text_ar || '', b.icon || '', b.is_active === false ? 0 : 1, id)
    .run()
  return c.json({ success: true })
})

adminApi.delete('/why/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM why_highlights WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

adminApi.put('/why/:id/reorder', async (c) => {
  const b = await c.req.json().catch(() => null)
  await reorder(c.env.DB, 'why_highlights', c.req.param('id'), b?.direction === 'up' ? -1 : 1)
  return c.json({ success: true })
})

// ============ Process steps ============
adminApi.get('/process', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM process_steps ORDER BY sort_order').all()
  return c.json({ items: rows.results })
})

adminApi.post('/process', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b?.title_en) return c.json({ error: 'title_en is required' }, 400)
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM process_steps').first<{ m: number }>()
  const nextSort = (maxRow?.m ?? -1) + 1
  const result = await c.env.DB.prepare(
    'INSERT INTO process_steps (title_en, title_ar, sort_order, is_active) VALUES (?, ?, ?, 1)'
  )
    .bind(b.title_en, b.title_ar || '', nextSort)
    .run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

adminApi.put('/process/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ error: 'Invalid body' }, 400)
  await c.env.DB.prepare('UPDATE process_steps SET title_en=?, title_ar=?, is_active=? WHERE id=?')
    .bind(b.title_en || '', b.title_ar || '', b.is_active === false ? 0 : 1, id)
    .run()
  return c.json({ success: true })
})

adminApi.delete('/process/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM process_steps WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

adminApi.put('/process/:id/reorder', async (c) => {
  const b = await c.req.json().catch(() => null)
  await reorder(c.env.DB, 'process_steps', c.req.param('id'), b?.direction === 'up' ? -1 : 1)
  return c.json({ success: true })
})

// ============ Social links ============
adminApi.get('/social-links', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM social_links ORDER BY sort_order').all()
  return c.json({ items: rows.results })
})

adminApi.post('/social-links', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b?.platform || !b?.url) return c.json({ error: 'platform and url are required' }, 400)
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM social_links').first<{ m: number }>()
  const nextSort = (maxRow?.m ?? -1) + 1
  const result = await c.env.DB.prepare(
    'INSERT INTO social_links (platform, label, url, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)'
  )
    .bind(b.platform, b.label || '', b.url, b.icon || 'fa-brands fa-link', nextSort)
    .run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

adminApi.put('/social-links/:id', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ error: 'Invalid body' }, 400)
  await c.env.DB.prepare(
    'UPDATE social_links SET platform=?, label=?, url=?, icon=?, is_active=? WHERE id=?'
  )
    .bind(b.platform || '', b.label || '', b.url || '', b.icon || '', b.is_active === false ? 0 : 1, id)
    .run()
  return c.json({ success: true })
})

adminApi.delete('/social-links/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM social_links WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

adminApi.put('/social-links/:id/reorder', async (c) => {
  const b = await c.req.json().catch(() => null)
  await reorder(c.env.DB, 'social_links', c.req.param('id'), b?.direction === 'up' ? -1 : 1)
  return c.json({ success: true })
})

// ============ Settings ============
adminApi.get('/settings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT key, value FROM settings').all()
  return c.json({ items: rows.results })
})

adminApi.put('/settings/:key', async (c) => {
  const key = c.req.param('key')
  const b = await c.req.json().catch(() => null)
  if (!b || typeof b.value !== 'string') return c.json({ error: 'value is required' }, 400)
  await c.env.DB.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP'
  )
    .bind(key, b.value)
    .run()
  return c.json({ success: true })
})

// ============ Media library (R2) ============
adminApi.get('/media', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM media ORDER BY created_at DESC').all()
  return c.json({ items: rows.results })
})

adminApi.post('/media/upload', async (c) => {
  const { DB, R2 } = c.env
  const form = await c.req.formData().catch(() => null)
  const file = form?.get('file')

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400)
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 10MB)' }, 413)
  }

  const isImage = file.type.startsWith('image/')
  const isAudio = file.type.startsWith('audio/')
  if (!isImage && !isAudio) {
    return c.json({ error: 'Only image and audio files are allowed' }, 400)
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
  const buf = await file.arrayBuffer()

  await R2.put(key, buf, { httpMetadata: { contentType: file.type } })

  const url = `/media/${key}`
  await DB.prepare(
    'INSERT INTO media (r2_key, url, filename, content_type, size_bytes, kind) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(key, url, file.name, file.type, file.size, isImage ? 'image' : 'audio')
    .run()

  return c.json({ success: true, url, key })
})

adminApi.delete('/media/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT r2_key FROM media WHERE id = ?').bind(id).first<{ r2_key: string }>()
  if (row) {
    await c.env.R2.delete(row.r2_key).catch(() => {})
  }
  await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ============ Feedback management ============
adminApi.get('/feedback', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 500').all()
  return c.json({ items: rows.results })
})

adminApi.put('/feedback/:id/status', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  const status = ['new', 'read', 'archived'].includes(b?.status) ? b.status : 'read'
  await c.env.DB.prepare('UPDATE feedback SET status = ? WHERE id = ?').bind(status, id).run()
  return c.json({ success: true })
})

adminApi.delete('/feedback/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT voice_r2_key FROM feedback WHERE id = ?').bind(id).first<{ voice_r2_key: string | null }>()
  if (row?.voice_r2_key) {
    await c.env.R2.delete(row.voice_r2_key).catch(() => {})
  }
  await c.env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Manually retry forwarding a feedback row to the Google Sheet (e.g. after
// fixing the Apps Script deployment permissions).
adminApi.post('/feedback/:id/resync', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    'SELECT id, message, emoji, voice_url, name, email_phone FROM feedback WHERE id = ?'
  )
    .bind(id)
    .first<{ id: number; message: string; emoji: string; voice_url: string | null; name: string; email_phone: string }>()
  if (!row) return c.json({ error: 'Not found' }, 404)

  const ok = await forwardToSheet(c.env, {
    formType: 'feedback',
    name: row.name || '',
    emailPhone: row.email_phone || '',
    message: row.voice_url ? `${row.message} [voice note: ${row.voice_url}]`.trim() : row.message,
    rating: row.emoji || '',
    dateTime: nowIso(),
  })
  if (ok) {
    await c.env.DB.prepare('UPDATE feedback SET sheet_synced = 1 WHERE id = ?').bind(id).run()
  }
  return c.json({ success: ok })
})

// ============ Contact form messages ============
adminApi.get('/contact', async (c) => {
  const rows = await c.env.DB
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500')
    .all()
  return c.json({ items: rows.results })
})

adminApi.put('/contact/:id/status', async (c) => {
  const id = c.req.param('id')
  const b = await c.req.json().catch(() => null)
  const status = ['new', 'read', 'archived'].includes(b?.status) ? b.status : 'read'
  await c.env.DB.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').bind(status, id).run()
  return c.json({ success: true })
})

adminApi.delete('/contact/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM contact_messages WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

// Manually retry forwarding a contact message to the Google Sheet.
adminApi.post('/contact/:id/resync', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    'SELECT id, name, email_phone, message FROM contact_messages WHERE id = ?'
  )
    .bind(id)
    .first<{ id: number; name: string; email_phone: string; message: string }>()
  if (!row) return c.json({ error: 'Not found' }, 404)

  const ok = await forwardToSheet(c.env, {
    formType: 'contact',
    name: row.name,
    emailPhone: row.email_phone,
    message: row.message,
    rating: '',
    dateTime: nowIso(),
  })
  if (ok) {
    await c.env.DB.prepare('UPDATE contact_messages SET sheet_synced = 1 WHERE id = ?').bind(id).run()
  }
  return c.json({ success: ok })
})

// ---- helper: swap sort_order with neighbor ----
async function reorder(DB: D1Database, table: string, id: string, direction: number) {
  const current = await DB.prepare(`SELECT id, sort_order FROM ${table} WHERE id = ?`).bind(id).first<{ id: number; sort_order: number }>()
  if (!current) return
  const neighbor = await DB.prepare(
    `SELECT id, sort_order FROM ${table} WHERE sort_order ${direction < 0 ? '<' : '>'} ? ORDER BY sort_order ${direction < 0 ? 'DESC' : 'ASC'} LIMIT 1`
  )
    .bind(current.sort_order)
    .first<{ id: number; sort_order: number }>()
  if (!neighbor) return

  await DB.batch([
    DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(neighbor.sort_order, current.id),
    DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(current.sort_order, neighbor.id),
  ])
}

export default adminApi
