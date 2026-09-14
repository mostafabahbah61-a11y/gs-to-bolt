-- VYRO Development — bilingual content blocks for the new Contact form fields
-- and optional Name/Email fields on the Feedback widget. Idempotent (safe to
-- re-run) via INSERT OR IGNORE, respecting the UNIQUE(section, field) index.

INSERT OR IGNORE INTO content_blocks (section, field, value_en, value_ar, sort_order) VALUES
  ('contact', 'form_title', 'Send us a message', 'أرسل لنا رسالة', 5),
  ('contact', 'name_placeholder', 'Your name', 'اسمك', 6),
  ('contact', 'email_placeholder', 'Email or phone number', 'البريد الإلكتروني أو رقم الهاتف', 7),
  ('contact', 'message_placeholder', 'Tell us about your project...', 'أخبرنا عن مشروعك...', 8),
  ('contact', 'btn_submit', 'Send Message', 'إرسال الرسالة', 9),
  ('contact', 'thanks', 'Thank you! We received your message and will get back to you soon.', 'شكرًا لك! تم استلام رسالتك وسنتواصل معك قريبًا.', 10),
  ('feedback', 'name_placeholder', 'Your name (optional)', 'اسمك (اختياري)', 7),
  ('feedback', 'email_placeholder', 'Email or phone (optional)', 'البريد الإلكتروني أو الهاتف (اختياري)', 8);
