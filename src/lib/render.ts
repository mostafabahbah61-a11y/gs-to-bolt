import type { ContentBundle } from './content'
import { t } from './content'

type Lang = 'en' | 'ar'

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderPage(bundle: ContentBundle, lang: Lang): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const other = lang === 'ar' ? 'en' : 'ar'
  const T = (section: string, field: string, fallback = '') => esc(t(bundle, section, field, lang, fallback))

  const brandName = T('brand', 'name', 'VYRO')
  const brandAccent = T('brand', 'name_accent', 'DEV')

  const navLinks: Array<[string, string]> = [
    ['#work', T('nav', 'work', 'Work')],
    ['#services', T('nav', 'services', 'Services')],
    ['#process', T('nav', 'process', 'Process')],
    ['#why', T('nav', 'why', 'Why Vyro')],
    ['#about', T('nav', 'about', 'About')],
    ['#connect', T('nav', 'connect', 'Connect')],
  ]

  const navHtml = navLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n')

  const projectCards = bundle.projects
    .map((p) => {
      const name = lang === 'ar' && p.name_ar ? p.name_ar : p.name_en
      const category = lang === 'ar' && p.category_ar ? p.category_ar : p.category_en
      return `
      <article class="work-card reveal" data-url="${esc(p.url)}" role="link" tabindex="0" aria-label="Open ${esc(name)} project">
        <div class="work-card-qr-wrap">
          <img src="${esc(p.qr_image_url)}" alt="QR code to visit ${esc(name)}" class="work-card-qr" loading="lazy" width="220" height="220" />
          <span class="scan-label"><i class="fa-solid fa-qrcode"></i> ${T('work', 'scan_label', 'SCAN TO VISIT')}</span>
        </div>
        <div class="work-card-info">
          <span class="work-card-category">${esc(category)}</span>
          <h3 class="work-card-name">${esc(name)}</h3>
          <a class="work-card-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">
            ${T('work', 'view_project', 'View Project')} <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </article>`
    })
    .join('\n')

  const whyCards = bundle.whyHighlights
    .map((w) => {
      const title = lang === 'ar' && w.title_ar ? w.title_ar : w.title_en
      const text = lang === 'ar' && w.text_ar ? w.text_ar : w.text_en
      return `
          <div class="why-card reveal">
            <div class="why-icon"><i class="${esc(w.icon)}"></i></div>
            <h3>${esc(title)}</h3>
            <p>${esc(text)}</p>
          </div>`
    })
    .join('\n')

  const serviceCards = bundle.services
    .map((s) => {
      const title = lang === 'ar' && s.title_ar ? s.title_ar : s.title_en
      return `
          <div class="service-card reveal">
            <div class="service-icon"><i class="${esc(s.icon)}"></i></div>
            <h3>${esc(title)}</h3>
          </div>`
    })
    .join('\n')

  const processSteps = bundle.processSteps
    .map((p, idx) => {
      const title = lang === 'ar' && p.title_ar ? p.title_ar : p.title_en
      const arrow =
        idx < bundle.processSteps.length - 1
          ? `<div class="process-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right-long"></i></div>`
          : ''
      return `
          <div class="process-step reveal">
            <span class="process-num">0${idx + 1}</span>
            <h3>${esc(title)}</h3>
          </div>
          ${arrow}`
    })
    .join('\n')

  const iconFor = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return 'fa-brands fa-tiktok'
      case 'instagram':
        return 'fa-brands fa-instagram'
      case 'whatsapp':
        return 'fa-brands fa-whatsapp'
      case 'email':
        return 'fa-solid fa-envelope'
      default:
        return 'fa-solid fa-link'
    }
  }

  const connectCards = bundle.socialLinks
    .map((s) => {
      const label = s.platform.charAt(0).toUpperCase() + s.platform.slice(1)
      return `
          <a class="connect-card reveal" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">
            <div class="connect-icon"><i class="${esc(s.icon || iconFor(s.platform))}"></i></div>
            <h3>${esc(label)}</h3>
            <p>${esc(s.label)}</p>
          </a>`
    })
    .join('\n')

  const whatsappNumber = bundle.settings.whatsapp_number || '201033623827'
  const contactEmail = bundle.settings.contact_email || 'hello@vyro.dev'
  const defaultTheme = bundle.settings.default_theme === 'light' ? 'light' : 'dark'

  const emojiOptions = ['😍', '🙂', '😐', '🙁', '😡']

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}" data-theme="${defaultTheme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VYRO Development — Premium Web &amp; Digital Studio</title>
  <meta name="description" content="VYRO Development builds premium websites, e-commerce and digital systems that turn ideas into real products. View our work and start a project today." />
  <meta name="keywords" content="VYRO Development, web development, e-commerce, UI/UX design, digital agency, digital systems" />
  <meta property="og:title" content="VYRO Development — We Build Digital Experiences" />
  <meta property="og:description" content="Websites, e-commerce and digital systems built to turn ideas into real products." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/static/images/logo.png" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="icon" href="/static/images/logo.png" type="image/png" />
  <link rel="alternate" hreflang="en" href="/?lang=en" />
  <link rel="alternate" hreflang="ar" href="/?lang=ar" />
  <link rel="preload" as="image" href="/static/images/hero-bg.jpg" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  ${lang === 'ar' ? `<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />` : ''}
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/style.css" rel="stylesheet" />
  <script>
    (function () {
      try {
        var saved = localStorage.getItem('vyro_theme');
        if (saved === 'dark' || saved === 'light') {
          document.documentElement.setAttribute('data-theme', saved);
        }
      } catch (e) {}
    })();
  </script>
</head>
<body class="lang-${lang}">
  <div class="noise-overlay" aria-hidden="true"></div>
  <div class="cursor-glow" aria-hidden="true"></div>

  <header class="site-header" id="site-header">
    <div class="header-inner">
      <a href="#top" class="brand" aria-label="VYRO Development home">
        <img src="/static/images/logo.png" alt="VYRO Development logo" class="brand-logo" />
        <span class="brand-name">${brandName}<span class="brand-accent">${brandAccent}</span></span>
      </a>
      <nav class="main-nav" id="main-nav" aria-label="Primary">
        ${navHtml}
        <a href="#contact" class="nav-cta">${T('nav', 'cta', 'Start a Project')}</a>
      </nav>
      <div class="header-controls">
        <button class="lang-toggle" id="lang-toggle" data-current="${lang}" data-other="${other}" aria-label="Switch language">
          <i class="fa-solid fa-globe"></i>
          <span>${lang === 'ar' ? 'EN' : 'AR'}</span>
        </button>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark / light mode">
          <i class="fa-solid fa-sun theme-icon-light"></i>
          <i class="fa-solid fa-moon theme-icon-dark"></i>
        </button>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main id="top">
    <!-- HERO -->
    <section class="hero" id="hero">
      <div class="hero-bg">
        <img src="/static/images/hero-bg.jpg" alt="" class="hero-bg-img" />
        <div class="hero-overlay"></div>
        <div class="hero-glow"></div>
      </div>

      <div class="hero-content">
        <div class="logo-3d-stage" aria-hidden="true">
          <div class="logo-3d-spin">
            <img src="/static/images/logo.png" alt="VYRO Development 3D logo" class="logo-3d-img" />
          </div>
          <div class="logo-3d-ring"></div>
        </div>

        <p class="hero-eyebrow">${T('hero', 'eyebrow', 'VYRO DEVELOPMENT')}</p>
        <h1 class="hero-title">${T('hero', 'headline_line1', 'WE BUILD DIGITAL')}<br /><span>${T('hero', 'headline_line2', 'EXPERIENCES.')}</span></h1>
        <p class="hero-text">${T('hero', 'text')}</p>
        <div class="hero-actions">
          <a href="#work" class="btn btn-primary">${T('hero', 'btn_work', 'VIEW OUR WORK')}</a>
          <a href="#contact" class="btn btn-outline">${T('hero', 'btn_start', 'START A PROJECT')}</a>
        </div>
      </div>

      <div class="scroll-indicator" aria-hidden="true">
        <span></span>
        <p>SCROLL</p>
      </div>
    </section>

    <!-- SELECTED WORK -->
    <section class="section work-section" id="work">
      <div class="section-inner">
        <p class="section-eyebrow reveal">${T('work', 'eyebrow', 'SELECTED WORK')}</p>
        <h2 class="section-title reveal">${T('work', 'title')}</h2>
        <div class="work-grid">
          ${projectCards}
        </div>
      </div>
    </section>

    <!-- WHY VYRO -->
    <section class="section why-section" id="why">
      <div class="section-inner">
        <p class="section-eyebrow reveal">${T('why', 'eyebrow', 'WHY VYRO?')}</p>
        <h2 class="section-title reveal">${T('why', 'title')}</h2>
        <p class="section-lead reveal">${T('why', 'lead')}</p>
        <div class="why-grid">
          ${whyCards}
        </div>
      </div>
    </section>

    <!-- SERVICES -->
    <section class="section services-section" id="services">
      <div class="section-inner">
        <p class="section-eyebrow reveal">${T('services', 'eyebrow', 'SERVICES')}</p>
        <h2 class="section-title reveal">${T('services', 'title')}</h2>
        <div class="services-grid">
          ${serviceCards}
        </div>
      </div>
    </section>

    <!-- PROCESS -->
    <section class="section process-section" id="process">
      <div class="section-inner">
        <p class="section-eyebrow reveal">${T('process', 'eyebrow', 'PROCESS')}</p>
        <h2 class="section-title reveal">${T('process', 'title')}</h2>
        <div class="process-track">
          ${processSteps}
        </div>
      </div>
    </section>

    <!-- ABOUT -->
    <section class="section about-section" id="about">
      <div class="section-inner about-inner">
        <p class="section-eyebrow reveal">${T('about', 'eyebrow', 'ABOUT VYRO')}</p>
        <h2 class="about-text reveal">${T('about', 'text')}</h2>
      </div>
    </section>

    <!-- CONNECT -->
    <section class="section connect-section" id="connect">
      <div class="section-inner">
        <p class="section-eyebrow reveal">${T('connect', 'eyebrow', 'CONNECT WITH VYRO')}</p>
        <h2 class="section-title reveal">${T('connect', 'title', "LET'S CONNECT")}</h2>
        <div class="connect-grid">
          ${connectCards}
        </div>
      </div>
    </section>

    <!-- FEEDBACK -->
    <section class="section feedback-section" id="feedback">
      <div class="section-inner">
        <p class="section-eyebrow reveal">${T('feedback', 'eyebrow', 'YOUR VOICE MATTERS')}</p>
        <h2 class="section-title reveal">${T('feedback', 'title')}</h2>

        <form class="feedback-box reveal" id="feedback-form">
          <div class="feedback-emojis" id="feedback-emojis" role="radiogroup" aria-label="Rate your experience">
            ${emojiOptions
              .map(
                (e) =>
                  `<button type="button" class="emoji-btn" data-emoji="${e}" aria-label="Rate ${e}">${e}</button>`
              )
              .join('\n')}
          </div>

          <div class="feedback-identity-row">
            <input
              type="text"
              id="feedback-name"
              class="feedback-input"
              placeholder="${T('feedback', 'name_placeholder', 'Your name (optional)')}"
              maxlength="200"
              autocomplete="name"
            />
            <input
              type="text"
              id="feedback-contact"
              class="feedback-input"
              placeholder="${T('feedback', 'email_placeholder', 'Email or phone (optional)')}"
              maxlength="200"
              autocomplete="email"
            />
          </div>

          <textarea
            id="feedback-message"
            class="feedback-textarea"
            placeholder="${T('feedback', 'placeholder')}"
            rows="4"
            maxlength="4000"
          ></textarea>

          <div class="feedback-voice-row">
            <button type="button" class="btn btn-outline btn-voice" id="voice-record-btn" data-record-label="${T('feedback', 'btn_record', 'Record a voice message')}" data-stop-label="${T('feedback', 'btn_stop', 'Stop recording')}">
              <i class="fa-solid fa-microphone"></i>
              <span>${T('feedback', 'btn_record', 'Record a voice message')}</span>
            </button>
            <span class="voice-timer" id="voice-timer" hidden>00:00</span>
            <audio id="voice-preview" hidden controls></audio>
            <button type="button" class="voice-clear" id="voice-clear-btn" hidden aria-label="Remove voice note">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="feedback-submit-row">
            <button type="submit" class="btn btn-primary" id="feedback-submit-btn">
              <i class="fa-solid fa-paper-plane"></i> ${T('feedback', 'btn_submit', 'Send Feedback')}
            </button>
            <p class="feedback-thanks" id="feedback-thanks" hidden>${T('feedback', 'thanks')}</p>
          </div>
        </form>
      </div>
    </section>

    <!-- CONTACT -->
    <section class="section contact-section" id="contact">
      <div class="section-inner contact-inner">
        <h2 class="contact-title reveal">${T('contact', 'title_line1', 'HAVE A PROJECT')}<br />${T('contact', 'title_line2', 'IN MIND?')}</h2>
        <p class="contact-sub reveal">${T('contact', 'sub', "LET'S BUILD IT.")}</p>
        <div class="contact-actions reveal">
          <a href="https://wa.me/${esc(whatsappNumber)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
            <i class="fa-brands fa-whatsapp"></i> ${T('contact', 'btn_whatsapp', 'WhatsApp')}
          </a>
          <a href="mailto:${esc(contactEmail)}" class="btn btn-outline">
            <i class="fa-solid fa-envelope"></i> ${T('contact', 'btn_email', 'Email Us')}
          </a>
        </div>

        <form class="contact-form reveal" id="contact-form">
          <h3 class="contact-form-title">${T('contact', 'form_title', 'Send us a message')}</h3>
          <div class="contact-form-row">
            <input
              type="text"
              id="contact-name"
              class="feedback-input"
              placeholder="${T('contact', 'name_placeholder', 'Your name')}"
              maxlength="200"
              autocomplete="name"
              required
            />
            <input
              type="text"
              id="contact-emailphone"
              class="feedback-input"
              placeholder="${T('contact', 'email_placeholder', 'Email or phone number')}"
              maxlength="200"
              autocomplete="email"
              required
            />
          </div>
          <textarea
            id="contact-message"
            class="feedback-textarea"
            placeholder="${T('contact', 'message_placeholder', 'Tell us about your project...')}"
            rows="4"
            maxlength="4000"
            required
          ></textarea>
          <div class="feedback-submit-row">
            <button type="submit" class="btn btn-primary" id="contact-submit-btn">
              <i class="fa-solid fa-paper-plane"></i> ${T('contact', 'btn_submit', 'Send Message')}
            </button>
            <p class="feedback-thanks" id="contact-thanks" hidden>${T('contact', 'thanks')}</p>
          </div>
        </form>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="/static/images/logo.png" alt="VYRO Development logo" class="footer-logo" />
        <span>${brandName} ${brandAccent}</span>
      </div>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} ${T('footer', 'text')}</p>
    </div>
  </footer>

  <script>window.__VYRO_LANG__ = "${lang}";</script>
  <script src="/static/app.js"></script>
</body>
</html>`
}
