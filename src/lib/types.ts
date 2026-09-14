export type Bindings = {
  DB: D1Database
  R2: R2Bucket
  JWT_SECRET?: string
  // Server-side only secret: Google Apps Script Web App URL used to sync
  // Contact + Feedback submissions into a Google Sheet. Never sent to the
  // browser — set via `.dev.vars` locally or `wrangler secret put GAS_WEBHOOK_URL`
  // in production.
  GAS_WEBHOOK_URL?: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: {
    adminUsername?: string
  }
}

export const FALLBACK_JWT_SECRET =
  'vyro-development-studio-fallback-secret-key-v1-change-in-wrangler-secret'
