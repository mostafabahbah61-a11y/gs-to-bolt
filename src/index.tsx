import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie } from 'hono/cookie'
import type { AppEnv } from './lib/types'
import { getContentBundle } from './lib/content'
import { renderPage } from './lib/render'
import publicApi from './routes/public'
import media from './routes/media'
import adminAuth from './routes/admin-auth'
import adminApi from './routes/admin-api'
import { adminDashboardHtml } from './lib/admin-page'

const app = new Hono<AppEnv>()

app.use('/static/*', serveStatic({ root: './public' }))

// ---- API routes ----
app.route('/api', publicApi)
app.route('/api/admin/auth', adminAuth)
app.route('/api/admin', adminApi)
app.route('/media', media)

// ---- Admin dashboard (SPA shell; auth enforced client-side + by API) ----
app.get('/admin', (c) => c.html(adminDashboardHtml))
app.get('/admin/*', (c) => c.html(adminDashboardHtml))

// ---- Public bilingual site ----
app.get('/', async (c) => {
  const cookieLang = getCookie(c, 'vyro_lang')
  const queryLang = c.req.query('lang')
  const lang = queryLang === 'ar' || queryLang === 'en' ? queryLang : cookieLang === 'ar' ? 'ar' : 'en'

  const bundle = await getContentBundle(c.env.DB)
  const html = renderPage(bundle, lang as 'en' | 'ar')
  return c.html(html)
})

export default app
