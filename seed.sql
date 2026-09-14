-- VYRO Development — seed data (bilingual EN/AR)

-- Admin user (username: admin / password: VyroAdmin@2026 — change after first login)
INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES
  ('admin', '31a2f2e9217f99a3b6a240635d68f5b1:74a96aa4f4c7ecec2c59f6741baad9724dae4dd3f5bd29bca4390a67c1be428e');

-- Settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('default_theme', 'dark'),
  ('default_lang', 'en'),
  ('whatsapp_number', '201033623827'),
  ('contact_email', 'hello@vyro.dev');

-- Content blocks: section, field, value_en, value_ar
INSERT OR IGNORE INTO content_blocks (section, field, value_en, value_ar, sort_order) VALUES
  ('brand', 'name', 'VYRO', 'فايرو', 0),
  ('brand', 'name_accent', 'DEV', 'ديف', 1),

  ('hero', 'eyebrow', 'VYRO DEVELOPMENT', 'فايرو ديفيلوبمنت', 0),
  ('hero', 'headline_line1', 'WE BUILD DIGITAL', 'نحن نبني تجارب', 1),
  ('hero', 'headline_line2', 'EXPERIENCES.', 'رقمية.', 2),
  ('hero', 'text', 'Websites, e-commerce and digital systems built to turn ideas into real products.', 'مواقع وتجارة إلكترونية وأنظمة رقمية مبنية لتحويل الأفكار إلى منتجات حقيقية.', 3),
  ('hero', 'btn_work', 'VIEW OUR WORK', 'اطّلع على أعمالنا', 4),
  ('hero', 'btn_start', 'START A PROJECT', 'ابدأ مشروعك', 5),

  ('nav', 'work', 'Work', 'أعمالنا', 0),
  ('nav', 'services', 'Services', 'خدماتنا', 1),
  ('nav', 'process', 'Process', 'آلية العمل', 2),
  ('nav', 'why', 'Why Vyro', 'لماذا فايرو', 3),
  ('nav', 'about', 'About', 'من نحن', 4),
  ('nav', 'connect', 'Connect', 'تواصل', 5),
  ('nav', 'cta', 'Start a Project', 'ابدأ مشروعك', 6),

  ('work', 'eyebrow', 'SELECTED WORK', 'أعمال مختارة', 0),
  ('work', 'title', 'Projects we''ve brought to life.', 'مشاريع حوّلناها إلى واقع.', 1),
  ('work', 'scan_label', 'SCAN TO VISIT', 'اسكن للزيارة', 2),
  ('work', 'view_project', 'View Project', 'عرض المشروع', 3),

  ('why', 'eyebrow', 'WHY VYRO?', 'لماذا فايرو؟', 0),
  ('why', 'title', 'We turn ideas into modern digital experiences.', 'نحوّل الأفكار إلى تجارب رقمية عصرية.', 1),
  ('why', 'lead', 'VYRO DEVELOPMENT focuses on clean design, smooth user experiences, powerful functionality, and websites built around real business goals.', 'تركز فايرو ديفيلوبمنت على التصميم النظيف، وتجربة استخدام سلسة، ووظائف قوية، ومواقع مبنية حول أهداف تجارية حقيقية.', 2),

  ('services', 'eyebrow', 'SERVICES', 'الخدمات', 0),
  ('services', 'title', 'What we do.', 'ما الذي نقدمه.', 1),

  ('process', 'eyebrow', 'PROCESS', 'آلية العمل', 0),
  ('process', 'title', 'How we work.', 'كيف نعمل.', 1),

  ('about', 'eyebrow', 'ABOUT VYRO', 'عن فايرو', 0),
  ('about', 'text', 'VYRO Development creates modern websites and digital experiences for businesses that want to stand out online.', 'تصمم فايرو ديفيلوبمنت مواقع وتجارب رقمية عصرية للشركات التي تريد أن تتميز عبر الإنترنت.', 1),

  ('connect', 'eyebrow', 'CONNECT WITH VYRO', 'تواصل مع فايرو', 0),
  ('connect', 'title', 'LET''S CONNECT', 'لنتواصل', 1),

  ('contact', 'title_line1', 'HAVE A PROJECT', 'هل لديك مشروع', 0),
  ('contact', 'title_line2', 'IN MIND?', 'في بالك؟', 1),
  ('contact', 'sub', 'LET''S BUILD IT.', 'لنبنيه معًا.', 2),
  ('contact', 'btn_whatsapp', 'WhatsApp', 'واتساب', 3),
  ('contact', 'btn_email', 'Email Us', 'راسلنا', 4),

  ('feedback', 'eyebrow', 'YOUR VOICE MATTERS', 'رأيك يهمنا', 0),
  ('feedback', 'title', 'What would you like us to improve or add to VYRO?', 'ما الذي تودّ أن نطوره أو نضيفه إلى فايرو؟', 1),
  ('feedback', 'placeholder', 'Share your thoughts, ideas or suggestions...', 'شاركنا أفكارك أو ملاحظاتك أو مقترحاتك...', 2),
  ('feedback', 'btn_record', 'Record a voice message', 'سجّل رسالة صوتية', 3),
  ('feedback', 'btn_stop', 'Stop recording', 'إيقاف التسجيل', 4),
  ('feedback', 'btn_submit', 'Send Feedback', 'إرسال الملاحظات', 5),
  ('feedback', 'thanks', 'Thank you! Your feedback has been received.', 'شكرًا لك! تم استلام ملاحظاتك.', 6),

  ('footer', 'text', 'VYRO Development. All rights reserved.', 'فايرو ديفيلوبمنت. جميع الحقوق محفوظة.', 0);

-- Projects (Selected Work) — QR images already uploaded to R2/static
INSERT OR IGNORE INTO projects (name_en, name_ar, category_en, category_ar, url, qr_image_url, sort_order) VALUES
  ('GlobeVisa Online', 'جلوب فيزا أونلاين', 'Travel & Visa Platform', 'منصة سفر وتأشيرات', 'https://globevisa-egy.lovable.app', '/static/images/qr-globevisa-egy.png', 0),
  ('Shawarma Hot', 'شاورما هوت', 'Restaurant Website', 'موقع مطعم', 'https://shawarma-hot.lovable.app', '/static/images/qr-shawarma-hot.png', 1),
  ('Fashion Bag Studio', 'فاشون باج ستوديو', 'E-commerce Website', 'متجر إلكتروني', 'https://fashion-bag-studio.lovable.app', '/static/images/qr-fashion-bag-studio.png', 2),
  ('Mazaq Hot', 'مذاق هوت', 'Restaurant Ordering Platform', 'منصة طلبات مطعم', 'https://mazaq-hotttt.lovable.app/', '/static/images/qr-mazaq-hotttt.png', 3);

-- Services
INSERT OR IGNORE INTO services (title_en, title_ar, icon, sort_order) VALUES
  ('Web Development', 'تطوير المواقع', 'fa-solid fa-code', 0),
  ('E-Commerce', 'التجارة الإلكترونية', 'fa-solid fa-cart-shopping', 1),
  ('UI/UX Design', 'تصميم واجهات المستخدم', 'fa-solid fa-pen-ruler', 2),
  ('Digital Systems', 'الأنظمة الرقمية', 'fa-solid fa-server', 3);

-- Process steps
INSERT OR IGNORE INTO process_steps (title_en, title_ar, sort_order) VALUES
  ('DISCOVER', 'اكتشاف', 0),
  ('DESIGN', 'تصميم', 1),
  ('BUILD', 'بناء', 2),
  ('LAUNCH', 'إطلاق', 3);

-- Why Vyro highlights
INSERT OR IGNORE INTO why_highlights (title_en, title_ar, text_en, text_ar, icon, sort_order) VALUES
  ('CREATIVE', 'إبداعي', 'Unique and modern designs that make brands stand out.', 'تصاميم مميزة وعصرية تجعل العلامات التجارية تتألق.', 'fa-solid fa-lightbulb', 0),
  ('FUNCTIONAL', 'وظيفي', 'Websites built to be fast, responsive, and easy to use.', 'مواقع مبنية لتكون سريعة ومتجاوبة وسهلة الاستخدام.', 'fa-solid fa-bolt', 1),
  ('BUSINESS-FOCUSED', 'موجّه للأعمال', 'We build digital solutions designed to help businesses grow.', 'نبني حلولاً رقمية مصممة لمساعدة الأعمال على النمو.', 'fa-solid fa-chart-line', 2);

-- Social links
INSERT OR IGNORE INTO social_links (platform, label, url, icon, sort_order) VALUES
  ('tiktok', '@vyro.development', 'https://www.tiktok.com/@vyro.development', 'fa-brands fa-tiktok', 0),
  ('instagram', '@vyro_71', 'https://www.instagram.com/vyro_71/', 'fa-brands fa-instagram', 1),
  ('whatsapp', '+20 103 362 3827', 'https://wa.me/201033623827', 'fa-brands fa-whatsapp', 2);
