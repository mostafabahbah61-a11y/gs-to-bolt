import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { FALLBACK_JWT_SECRET, type AppEnv } from './types'

const COOKIE_NAME = 'vyro_admin_session'

export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const secret = c.env.JWT_SECRET || FALLBACK_JWT_SECRET
    const payload = await verify(token, secret, 'HS256')
    c.set('adminUsername', payload.sub as string)
    await next()
  } catch {
    return c.json({ error: 'Session expired. Please log in again.' }, 401)
  }
}
