# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ⚠️ This is VISBOT. Not WaBot. Not any other project. Always work inside this folder only.

## Dev Commands

```bash
# Frontend (Next.js 14, port 3000)
cd frontend && npm run dev
cd frontend && npm run typecheck      # tsc --noEmit
cd frontend && npm run lint

# Backend (Express + tsx, port 4000)
cd backend && npm run dev             # tsx watch src/index.ts
cd backend && npx tsc --noEmit

# Supabase migrations
npx supabase db push                  # push local migrations to remote
```

## Architecture

```
visbot/
├── frontend/   Next.js 14 App Router → Vercel, port 3000
├── backend/    Express API → Railway, port 4000
├── supabase/   SQL migrations (001_initial_schema.sql)
└── src/        Shared TypeScript types (Database, Company, Visitor, CheckIn, Material)
```

### Two auth flows — keep them separate

1. **Supabase auth** — `createClient()` / `createServerClient()` in `lib/supabase/`. Used for direct Supabase queries in Next.js server components and API routes. Session cookie is managed by `@supabase/ssr`.

2. **Backend JWT** — `lib/api.ts` (axios instance). Reads `visbot_token` from `localStorage`, sends as `Authorization: Bearer`. The Express `authMiddleware` in `backend/src/middleware/auth.ts` verifies with `NEXTAUTH_SECRET` and extracts `company_id` + `role` from the payload. All `/api/*` routes on the backend require this token.

### Data flow

- **Kiosk / check-in**: Next.js API routes (`/api/otp/send`, `/api/otp/verify`, `/api/checkin`) → direct Supabase insert + Redis OTP. No backend JWT required.
- **Admin dashboard**: `lib/api.ts` axios → Express backend (`localhost:4000`) → Supabase service role. Requires JWT.
- **Realtime**: `hooks/useRealtimeFeed.ts` subscribes to `postgres_changes` on `checkins` table via Supabase Realtime websocket. Needs `NEXT_PUBLIC_COMPANY_ID` set.

### Supabase RLS

All tables have RLS enabled. `checkins` and `materials` are filtered by:
```sql
company_id = (select id from companies where slug = current_setting('app.company_slug', true))
```
`visitors` table is global (readable/writable by any authenticated user). The `x-company-slug` header is set by `middleware.ts` from the subdomain.

### Key patterns

**Supabase client** — always import from `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (server components/API routes). Never instantiate directly.

**Brand colors** — Tailwind custom scale: `brand-50`, `brand-100`, `brand-500` (#1D9E75), `brand-600`, `brand-700`. Use `brand-500` for primary actions.

**Form pattern** — `react-hook-form` + `zodResolver` + `zod` schema. See `CheckInForm` and `LoginForm` for reference.

**Loading skeletons** — use `animate-pulse bg-gray-100 rounded` divs that mirror the shape of the loaded content.

**Photo storage** — `lib/storage.ts` switches between Cloudinary and Supabase Storage based on `STORAGE_PROVIDER` env var. Supabase bucket name is `photos`.

### Database tables

| Table | Key fields | Notes |
|-------|-----------|-------|
| `companies` | `id`, `slug`, `name`, `logo_url`, `plan` | slug = subdomain |
| `visitors` | `id`, `phone` (unique), `name`, `email` | global, phone-deduplicated |
| `checkins` | `visitor_id`, `company_id`, `purpose`, `host_name`, `status`, `photo_url` | status: `checked_in` \| `checked_out` |
| `materials` | `company_id`, `checkin_id`, `item_name`, `quantity`, `direction`, `return_expected`, `returned_at` | direction: `in` \| `out` |

### Environment variables

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only (API routes)
- `NEXT_PUBLIC_API_URL` — backend URL (`http://localhost:4000` locally)
- `NEXT_PUBLIC_COMPANY_ID` — UUID of the company for kiosk/realtime (set per-deployment)
- `REDIS_URL` — OTP storage (use public TCP URL for local dev, internal for Railway)
- `NEXTAUTH_SECRET` — JWT signing secret (must match backend)

**Backend** (`backend/.env`):
- `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL`
- `REDIS_URL`, `NEXTAUTH_SECRET`, `PORT=4000`, `FRONTEND_URL`

### Duplicate controller files

`backend/src/controllers/` has both `checkin.controller.ts` and `checkinController.ts` (same for material). The `.controller.ts` naming convention is the live one; the `Controller.ts` files are stubs. Same routes are wired in `backend/src/routes/`.
