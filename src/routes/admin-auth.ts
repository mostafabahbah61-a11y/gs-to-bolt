import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { setCookie, deleteCookie } from 'hono/cookie'
import { verifyPassword } from '../lib/auth'
import { FALLBACK_JWT_SECRET, type AppEnv } from '../lib/types'
import { requireAdmin } from '../lib/admin-middleware'

const adminAuth = new Hono<AppEnv>()

const COOKIE_NAME = 'vyro_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8 hours

adminAuth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!username || !password) {
    return c.json({ error: 'Username and password are required.' }, 400)
  }

  const { DB } = c.env
  const row = await DB.prepare('SELECT username, password_hash FROM admin_users WHERE username = ?')
    .bind(username)
    .first<{ username: string; password_hash: string }>()

  if (!row) {
    return c.json({ error: 'Invalid username or password.' }, 401)
  }

  const valid = await verifyPassword(password, row.password_hash)
  if (!valid) {
    return c.json({ error: 'Invalid username or password.' }, 401)
  }

  const secret = c.env.JWT_SECRET || FALLBACK_JWT_SECRET
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const token = await sign({ sub: row.username, exp }, secret)

  const isHttps = c.req.url.startsWith('https://')

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  return c.json({ success: true, username: row.username })
})

adminAuth.post('/logout', async (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ success: true })
})

adminAuth.post('/change-password', requireAdmin, async (c) => {
  const adminUsername = c.get('adminUsername')
  if (!adminUsername) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json().catch(() => null)
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters.' }, 400)
  }

  const { DB } = c.env
  const row = await DB.prepare('SELECT password_hash FROM admin_users WHERE username = ?')
    .bind(adminUsername)
    .first<{ password_hash: string }>()

  if (!row) return c.json({ error: 'Admin user not found.' }, 404)

  const valid = await verifyPassword(currentPassword, row.password_hash)
  if (!valid) return c.json({ error: 'Current password is incorrect.' }, 401)

  const { hashPassword } = await import('../lib/auth')
  const newHash = await hashPassword(newPassword)

  await DB.prepare('UPDATE admin_users SET password_hash = ? WHERE username = ?')
    .bind(newHash, adminUsername)
    .run()

  return c.json({ success: true })
})

export { COOKIE_NAME }
export default adminAuth
