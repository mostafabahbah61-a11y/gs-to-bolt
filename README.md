# VYRO Development — Premium Bilingual Digital Studio Website

## Project Overview
- **Name**: VYRO Development
- **Goal**: A premium, dark/light, bilingual (English/Arabic) one-page website for VYRO's digital studio — showcasing a 3D rotating brand logo, selected work with scannable QR codes, services, process, social/contact channels, an interactive feedback widget, and a full no-code Admin Dashboard for managing every piece of content.
- **Style**: Dark charcoal + warm orange glow (with a matching light theme), glassmorphism cards, scroll-reveal micro-interactions, cursor glow, fully responsive, RTL-aware for Arabic.

## URLs
- **Local preview**: http://localhost:3000 (sandbox)
- **Public sandbox URL**: https://3000-i6m7kwtimp8ngrrhtnokw-2e1b9533.sandbox.novita.ai
- **Production**: _to be added after Cloudflare Pages deploy_

## Currently Completed Features

### Public Site
- **Hero** — full-bleed background image, animated glow, headline, sub-copy, two CTAs.
- **3D Rotating Logo** — CSS `@keyframes` Y-axis spin inside a glowing ring, respects `prefers-reduced-motion`.
- **Selected Work** — project cards with QR image, name, category; click-through to live project URL. Fully manageable from the admin dashboard (add/edit/delete/reorder/replace QR image).
- **Why VYRO?**, **Services**, **Process**, **About**, **Connect (social links)**, **Contact CTA** — all bilingual, all editable from the admin dashboard.
- **🌐 Arabic & English (bilingual)** — every section of content is stored in both languages. A header **language switcher** (`EN` / `AR`) swaps the whole page:
  - Server-side rendering picks the language from `?lang=` query param, falling back to a `vyro_lang` cookie, defaulting to English.
  - `<html dir="rtl">` is set automatically for Arabic, with CSS logical properties (`inset-inline-*`, `border-inline-*`) so layout mirrors correctly.
  - Arabic text uses the **Cairo** Google Font; English keeps the original display font.
- **🌓 Dark & Light Mode** — a header **theme toggle** switches `html[data-theme]` between `dark` (default) and `light`, with a full light color palette defined via CSS variables. Preference is saved to `localStorage` and re-applied instantly on load (inline head script prevents flash-of-wrong-theme).
- **💬 Feedback & Suggestions widget** — a dedicated "Feedback" section asking *"What would you like us to improve or add to VYRO?"*:
  - Free-text message box.
  - Emoji reaction picker (😍 🙂 😐 🙁 😡), single-select.
  - Optional short **voice message** recording directly in the browser (MediaRecorder API, 60s auto-stop cap, live timer, preview/clear before submit, uploaded to R2).
  - Submits to the backend and shows a thank-you confirmation.
- Responsive navigation, mobile hamburger menu, smooth scrolling, scroll-reveal animations, sticky/blurred header, basic SEO (meta/OG tags, hreflang alternates for en/ar).

### 📬 Contact Form + Google Sheet Sync
- A new **"Send us a message"** form was added to the Contact section (Name, Email/Phone, Message) alongside the existing WhatsApp/Email buttons — nothing existing was removed or restyled.
- Both the **Contact form** and the **Feedback widget** (which now also has optional Name / Email-Phone fields) save every submission to D1 first (source of truth), then forward it in the background to a **Google Apps Script Web App webhook** which appends a row to a Google Sheet with: Name, Email/Phone, Message, Rating/Emoji, Date & Time.
- **Security**: the webhook URL is stored server-side only as the `GAS_WEBHOOK_URL` binding (`.dev.vars` locally, `wrangler secret put GAS_WEBHOOK_URL` in production) — it is never sent to the browser or embedded in any frontend JS/HTML.
- **Reliability**: sheet sync is fire-and-forget (`c.executionCtx.waitUntil`) and never blocks or fails the visitor's submission. Every row's sync status (`sheet_synced`) is tracked in D1 and visible in the Admin Dashboard, with a **"Retry sync"** button on any unsynced row.
- **Response validation**: a webhook response is only accepted as a success if it returns `Content-Type: application/json` with an explicit success flag — Google's own HTML error pages (e.g. permission/deployment errors) return HTTP 200 but are correctly detected and rejected, so failures are never silently marked as delivered.

### 🔐 Admin Dashboard (`/admin`)
A full single-page app (vanilla JS, no framework) for managing the entire site without touching code:
- **Secure login** — JWT session in an httpOnly cookie, PBKDF2-hashed password (Web Crypto, Workers-compatible), 8-hour session.
- **Content tab** — edit every bilingual text block (hero, nav, why, services, process, about, connect, contact, feedback, footer) inline, EN/AR side by side.
- **Projects tab** — add/edit/delete projects, upload/replace QR image, reorder (move up/down), toggle active/inactive.
- **Services / Why / Process tabs** — full CRUD + reordering for each list.
- **Social Links tab** — manage TikTok/Instagram/WhatsApp (or any) links, icons, order.
- **Media Library tab** — upload images/audio to R2, view/delete, copy URL.
- **Feedback tab** — view all visitor feedback (message, emoji, optional voice playback, language, submitted date), mark as read/archived, delete. Badge shows count of new feedback.
- **Settings tab** — WhatsApp number, contact email, default theme, default language, change admin password.

## Functional Entry URIs

### Public
| Method | Path | Description |
|---|---|---|
| GET | `/` | Renders the bilingual single-page site. Query param `?lang=en\|ar` selects language (also settable via `vyro_lang` cookie). |
| GET | `/static/*` | Static assets (logo, hero background, QR codes, CSS, JS). |
| GET | `/media/*` | Serves uploaded R2 objects (images, voice recordings) by key. |
| GET | `/api/content` | Public JSON bundle of all bilingual content, projects, services, process steps, why-highlights, social links, settings. |
| POST | `/api/feedback` | Submit feedback. Body: `{ message, emoji, lang, voiceR2Key?, voiceUrl? }`. |
| POST | `/api/feedback/voice` | Upload a voice recording blob (multipart, ≤5MB) → returns `{ r2Key, url }` to attach to a feedback submission. |
| POST | `/api/contact` | Submit the Contact form. Body: `{ name, emailPhone, message, lang }`. Saved to D1 and forwarded to the Google Sheet webhook in the background. |

### Admin (all require an authenticated session cookie, see Auth below)
| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | `{ username, password }` → sets session cookie. |
| POST | `/api/admin/auth/logout` | Clears session cookie. |
| POST | `/api/admin/auth/change-password` | `{ currentPassword, newPassword }`. |
| GET | `/api/admin/me` | Returns current logged-in username. |
| GET/PUT | `/api/admin/content` , `/api/admin/content/:id` | List / update bilingual content blocks. |
| GET/POST/PUT/DELETE | `/api/admin/projects[/:id]`, `/api/admin/projects/:id/reorder` | Projects CRUD + reorder. |
| GET/POST/PUT/DELETE | `/api/admin/services[/:id]`, `/api/admin/services/:id/reorder` | Services CRUD + reorder. |
| GET/POST/PUT/DELETE | `/api/admin/why[/:id]`, `/api/admin/why/:id/reorder` | Why-highlights CRUD + reorder. |
| GET/POST/PUT/DELETE | `/api/admin/process[/:id]`, `/api/admin/process/:id/reorder` | Process steps CRUD + reorder. |
| GET/POST/PUT/DELETE | `/api/admin/social-links[/:id]`, `/api/admin/social-links/:id/reorder` | Social links CRUD + reorder. |
| GET/PUT | `/api/admin/settings`, `/api/admin/settings/:key` | Site settings (upsert). |
| GET/POST/DELETE | `/api/admin/media[/upload][/:id]` | Media library: list, upload (multipart, ≤10MB, image/audio), delete (also removes from R2). |
| GET/PUT/DELETE | `/api/admin/feedback[/:id/status][/:id]` | List feedback, update status (new/read/archived), delete (also removes voice recording from R2 if present). |
| POST | `/api/admin/feedback/:id/resync` | Manually retry forwarding a feedback row to the Google Sheet. |
| GET/PUT/DELETE | `/api/admin/contact[/:id/status][/:id]` | List Contact form messages, update status (new/read/archived), delete. |
| POST | `/api/admin/contact/:id/resync` | Manually retry forwarding a contact message to the Google Sheet. |
| GET | `/admin`, `/admin/*` | Serves the Admin Dashboard SPA shell. |

**Default admin credentials** (created by `seed.sql` — **change immediately after first login** via Settings → Change Password):
- Username: `admin`
- Password: `VyroAdmin@2026`

## Data Architecture
- **Storage services**: Cloudflare **D1** (SQLite) for all relational content, and Cloudflare **R2** for uploaded media (images + voice recordings).
- **Data models** (see `migrations/0001_initial_schema.sql`):
  - `settings` — key/value site settings (whatsapp_number, contact_email, default_theme, default_lang).
  - `content_blocks` — `(section, field, value_en, value_ar)`, unique per section+field — powers every bilingual text on the site.
  - `projects` — bilingual name/category, url, qr_image_url, sort_order, is_active.
  - `services`, `process_steps`, `why_highlights` — bilingual title(+text/icon), sort_order.
  - `social_links` — platform, label, url, icon, sort_order.
  - `media` — r2_key, url, filename, content_type, size_bytes, kind (image/audio), created_at.
  - `feedback` — message, emoji, voice_r2_key, voice_url, lang, status (new/read/archived), name, email_phone, sheet_synced, created_at.
  - `contact_messages` — name, email_phone, message, lang, status (new/read/archived), sheet_synced, created_at.
  - `admin_users` — username, password_hash (PBKDF2, format `saltHex:hashHex`).
- **External integration**: `GAS_WEBHOOK_URL` (server-side secret) — Google Apps Script Web App endpoint that mirrors every Contact/Feedback submission into a Google Sheet (Name, Email/Phone, Message, Rating/Emoji, Date & Time). See `src/lib/sheet-sync.ts`.
- **Data flow**: `GET /` runs a server-side query against D1 (`getContentBundle`) and renders full HTML (`renderPage`) per request — no client-side content fetching needed for the public page. The Admin SPA fetches/mutates the same D1 tables via the `/api/admin/*` REST endpoints, protected by JWT-in-httpOnly-cookie auth (`hono/jwt`, HS256). Uploaded files (QR images, media library items, voice messages) are streamed to R2 and served back through `GET /media/*`.

## User Guide

### Visitors
1. Land on the hero — the 3D VYRO logo rotates continuously.
2. Use the header **language switcher** (EN/AR) and **theme toggle** (🌙/☀️) at any time — preferences persist.
3. Scroll or use the nav to jump to **Work**, **Services**, **Process**, **Why Vyro**, **About**, **Connect**, **Feedback**, or **Contact**.
4. In **Selected Work**, click any QR image or project card to open the live project in a new tab.
5. In the **Feedback** section, write a message, pick an emoji, optionally record a short voice note, and submit.
6. In **Let's Connect** / **Contact**, use the social cards or WhatsApp/Email buttons to start a conversation.

### Admin
1. Go to `/admin` and log in with the credentials above.
2. Use the sidebar to switch between Content, Projects, Services, Why, Process, Social, Media, Feedback, and Settings.
3. Every list supports Add / Edit / Delete / Reorder (▲▼) inline — no redeploy needed, changes are live immediately (read straight from D1 on every page load).
4. Upload or replace images/QR codes/voice files via the Media tab or directly inside a Project's form.
5. Review and manage visitor feedback (including playing back voice messages) in the Feedback tab.
6. **Change the default password** in Settings before sharing the site publicly.

## ⚠️ Action Required: Google Apps Script Webhook Permission Error
The provided webhook URL (`https://script.google.com/macros/s/AKfycbzzvHae0lAudAHNjmNKQH64HFaj-_bRapbAGo9ZojHeMLkZns72FXv7_dTshz0z0Yyx/exec`) is **currently rejecting requests** with a Google-side error, independent of anything in this codebase:
- `POST` → `"Error: You do not have permission to access the requested document."`
- `GET` → `"Script function not found: doGet"`

This means the Apps Script project needs to be fixed/redeployed on the Google side before rows will actually reach the Sheet:
1. In the Apps Script editor, make sure there is a `doPost(e)` function that parses `JSON.parse(e.postData.contents)` and writes a row to the target Sheet.
2. It must return JSON, e.g. `return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);` — an HTML response (even with HTTP 200) is treated as a failure by our sync check.
3. Re-deploy via **Deploy → Manage deployments → Edit → New version**, with **Execute as: Me** and **Who has access: Anyone** (or "Anyone with Google account" if that fits your security needs).
4. Complete the Google authorization prompt for the script to access the target Spreadsheet (this is almost always the cause of the "You do not have permission" error — the script was never authorized against the Sheet after being deployed/edited).

**Nothing is lost in the meantime**: every Contact and Feedback submission is saved to Cloudflare D1 regardless of sheet sync outcome, visible and manageable from the Admin Dashboard's Contact Messages / Feedback tabs, each showing a "Not synced" badge with a **Retry sync** button — once the Apps Script is fixed, just click Retry sync on existing rows (new submissions will sync automatically).

## Features Not Yet Implemented
- No production Cloudflare deploy yet (local D1/R2 only, via `wrangler --local`); production `database_id` in `wrangler.jsonc` is a placeholder pending `wrangler d1 create`.
- No rich-text/WYSIWYG editor for content fields (plain text/textarea only).
- No image cropping/resizing on upload (files are stored as-is in R2).
- No pagination on Feedback/Media lists (fine at current small scale).

## Recommended Next Steps
- Deploy to Cloudflare Pages: create real D1 database (`wrangler d1 create webapp-production`) and R2 bucket, update `wrangler.jsonc` with the real `database_id`, run `wrangler d1 migrations apply` + seed against production, then `wrangler pages deploy`.
- Change the default admin password immediately after first production login.
- Optionally add a custom domain.
- Consider adding pagination/search to the Feedback and Media tabs if volume grows.

## Deployment
- **Platform**: Cloudflare Pages (Workers runtime) with D1 + R2 bindings.
- **Status**: ✅ Running locally in sandbox via PM2 + Wrangler (`--local` D1/R2) — production deploy pending.
- **Tech Stack**: Hono 4 + TypeScript, `hono/jwt` + `hono/cookie` for auth, Web Crypto PBKDF2 for password hashing, Cloudflare D1 (SQLite) + R2 (object storage), vanilla CSS/JS frontend (no build-heavy framework), CDN Font Awesome + Google Fonts (Cairo for Arabic).
- **Last Updated**: 2026-08-30
