import { Hono } from 'hono'
import type { AppEnv } from '../lib/types'

// Serves R2-stored objects (uploaded images, replaced media, voice feedback notes)
const media = new Hono<AppEnv>()

media.get('/*', async (c) => {
  const key = c.req.path.replace(/^\/media\//, '')
  if (!key) return c.notFound()

  const { R2 } = c.env
  const object = await R2.get(key)
  if (!object) return c.notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})

export default media
