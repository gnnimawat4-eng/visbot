-- VisBot initial schema
-- Run in Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Companies (tenants) ──────────────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,  -- subdomain: techcorp.visbot.in
  logo_url    TEXT,
  address     TEXT,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Visitors ─────────────────────────────────────────────────────────────────
CREATE TABLE visitors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  photo_url   TEXT,
  id_type     TEXT CHECK (id_type IN ('aadhaar','passport','dl','voter_id')),
  id_number   TEXT,
  is_flagged  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (phone, company_id)  -- same person at different companies = separate records
);

-- ── Check-ins ─────────────────────────────────────────────────────────────────
CREATE TABLE checkins (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  visitor_id       UUID NOT NULL REFERENCES visitors(id),
  host_name        TEXT NOT NULL,
  host_department  TEXT,
  purpose          TEXT DEFAULT 'meeting' CHECK (purpose IN ('meeting','delivery','interview','maintenance','other')),
  status           TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in','checked_out','no_show')),
  checked_in_at    TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at   TIMESTAMPTZ,
  notes            TEXT,
  otp_used         BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Materials ─────────────────────────────────────────────────────────────────
CREATE TABLE materials (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  checkin_id       UUID NOT NULL REFERENCES checkins(id),
  name             TEXT NOT NULL,
  quantity         INTEGER NOT NULL DEFAULT 1,
  unit             TEXT DEFAULT 'pcs',
  direction        TEXT NOT NULL CHECK (direction IN ('in','out')),
  return_expected  BOOLEAN DEFAULT false,
  returned_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_visitors_phone      ON visitors(phone, company_id);
CREATE INDEX idx_checkins_company    ON checkins(company_id, checked_in_at DESC);
CREATE INDEX idx_checkins_status     ON checkins(company_id, status);
CREATE INDEX idx_materials_pending   ON materials(company_id, return_expected) WHERE returned_at IS NULL;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE companies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials  ENABLE ROW LEVEL SECURITY;

-- Companies: only their own row
CREATE POLICY "company_isolation" ON companies
  USING (id = (current_setting('app.company_id', true))::uuid);

-- Visitors: only own company
CREATE POLICY "visitor_isolation" ON visitors
  USING (company_id = (current_setting('app.company_id', true))::uuid);

-- Checkins: only own company
CREATE POLICY "checkin_isolation" ON checkins
  USING (company_id = (current_setting('app.company_id', true))::uuid);

-- Materials: only own company
CREATE POLICY "material_isolation" ON materials
  USING (company_id = (current_setting('app.company_id', true))::uuid);

-- ── Realtime (for gate display) ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
