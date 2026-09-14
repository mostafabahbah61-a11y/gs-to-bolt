-- VYRO Development — Contact form + Google Sheet sync support

-- Visitor contact form submissions (Name / Email-Phone / Message)
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email_phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new',      -- new | read | archived
  sheet_synced INTEGER NOT NULL DEFAULT 0, -- 1 once successfully forwarded to Google Sheet
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);

-- Extend feedback with optional Name / Email-Phone and a sheet sync flag
ALTER TABLE feedback ADD COLUMN name TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback ADD COLUMN email_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE feedback ADD COLUMN sheet_synced INTEGER NOT NULL DEFAULT 0;
