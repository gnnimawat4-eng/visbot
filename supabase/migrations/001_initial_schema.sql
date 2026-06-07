-- VisBot: Multi-tenant visitor management schema
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Companies (tenants) ──────────────────────────────────
create table companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,        -- used for subdomain: slug.visbot.in
  logo_url    text,
  plan        text default 'starter',      -- starter | pro | enterprise
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── Visitors (global, phone-deduplicated) ────────────────
create table visitors (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  phone            text unique not null,
  email            text,
  last_company_id  uuid references companies(id),
  created_at       timestamptz default now()
);
create index idx_visitors_phone on visitors(phone);

-- ── Check-ins ────────────────────────────────────────────
create table checkins (
  id               uuid primary key default uuid_generate_v4(),
  visitor_id       uuid not null references visitors(id),
  company_id       uuid not null references companies(id),
  purpose          text not null check (purpose in ('meeting','delivery','interview','other')),
  host_name        text not null,
  photo_url        text,
  status           text default 'checked_in' check (status in ('checked_in','checked_out')),
  checked_out_at   timestamptz,
  created_at       timestamptz default now()
);
create index idx_checkins_company_date on checkins(company_id, created_at desc);
create index idx_checkins_status       on checkins(status);

-- ── Materials in/out ─────────────────────────────────────
create table materials (
  id               uuid primary key default uuid_generate_v4(),
  checkin_id       uuid references checkins(id),
  company_id       uuid not null references companies(id),
  item_name        text not null,
  quantity         int  not null default 1,
  direction        text not null check (direction in ('in','out')),
  return_expected  boolean default false,
  returned_at      timestamptz,
  created_at       timestamptz default now()
);
create index idx_materials_company on materials(company_id, direction);

-- ── Row-Level Security ───────────────────────────────────
alter table companies  enable row level security;
alter table visitors   enable row level security;
alter table checkins   enable row level security;
alter table materials  enable row level security;

-- Company staff can only see their own company data
create policy "company_isolation_checkins"  on checkins  for all using (company_id = (select id from companies where slug = current_setting('app.company_slug', true)));
create policy "company_isolation_materials" on materials for all using (company_id = (select id from companies where slug = current_setting('app.company_slug', true)));
-- Visitors are global (readable by any authenticated user)
create policy "visitors_read"  on visitors for select using (auth.role() = 'authenticated');
create policy "visitors_write" on visitors for all    using (auth.role() = 'authenticated');

-- Enable realtime on check-ins
alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table materials;
