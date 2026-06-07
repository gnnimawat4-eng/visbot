# VisBot — Visitor Management SaaS

Multi-company visitor management system with photo check-in, OTP autofill for returning visitors, material in/out tracking, and a real-time company dashboard.

## Stack
| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 14 (App Router) → **Vercel** |
| Backend   | Node.js + Express + Bull → **Railway** |
| Database  | PostgreSQL + Realtime + Auth → **Supabase** |
| Cache     | Redis → Railway                     |
| SMS/OTP   | Fast2SMS / Twilio                   |
| Media     | Cloudinary / Supabase Storage       |

## Quick start
```bash
# 1. Clone & install
git clone <repo>
cd visbot/frontend && npm install
cd ../backend  && npm install

# 2. Copy env
cp .env.local.example .env.local   # fill in values

# 3. Run Supabase migrations
npx supabase db push

# 4. Dev
cd frontend && npm run dev      # http://localhost:3000
cd backend  && npm run dev      # http://localhost:4000
```

## Features
- Visitor check-in with live webcam photo capture
- Returning visitor detection + OTP auto-send
- Material in/out tracking with return alerts
- Real-time gate display via Supabase Realtime
- Multi-tenant (company-per-subdomain) with Row-Level Security
- Super admin panel for SaaS management
