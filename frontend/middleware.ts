import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient }       from '@supabase/supabase-js'

type Role = 'saas_owner' | 'admin' | 'guard'

const ROLE_HOME: Record<Role, string> = {
  saas_owner: '/owner/dashboard',
  admin:      '/dashboard',
  guard:      '/guard',
}

const ROLE_PREFIX: Record<Role, string> = {
  saas_owner: '/owner',
  admin:      '/dashboard',
  guard:      '/guard',
}

const PROTECTED = ['/owner', '/dashboard', '/guard']

/**
 * Service-role Supabase client — bypasses RLS.
 * Safe to use in middleware (Edge Runtime, server-side only).
 * Created once per cold-start; reused across requests.
 */
let _adminDb: ReturnType<typeof createClient> | null = null
function getAdminDb() {
  if (!_adminDb) {
    _adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return _adminDb
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // ── Skip — no auth needed ────────────────────────────────────
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/kiosk') ||
    pathname.startsWith('/checkin') ||
    pathname.startsWith('/gate') ||
    pathname === '/no-access'
  ) {
    return supabaseResponse
  }

  // ── Cookie-based client — only for session verification ──────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected   = PROTECTED.some(p => pathname.startsWith(p))
  const isLoginPage   = pathname === '/login' || pathname === '/auth/login'
  const isRootOrLogin = isLoginPage || pathname === '/'

  // ── Not logged in ─────────────────────────────────────────────
  if (!user) {
    if (isProtected) return NextResponse.redirect(new URL('/login', request.url))
    return supabaseResponse
  }

  // ── Logged in — only check role when the route needs it ──────
  const needsRoleCheck = isProtected || isRootOrLogin
  if (!needsRoleCheck) return supabaseResponse

  // ── Profile lookup via service-role (bypasses RLS) ───────────
  const { data: profile, error: profileError } = await getAdminDb()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  console.log('[middleware] pathname   :', pathname)
  console.log('[middleware] user.id    :', user.id)
  console.log('[middleware] profile    :', profile)
  console.log('[middleware] profileErr :', profileError?.message ?? null)

  const role = profile?.role as Role | undefined

  // ── No profile found ──────────────────────────────────────────
  if (!role) {
    console.log('[middleware] No role → /no-access')
    return NextResponse.redirect(new URL('/no-access', request.url))
  }

  const home   = ROLE_HOME[role]
  const prefix = ROLE_PREFIX[role]

  console.log('[middleware] role:', role, '→ home:', home)

  // On login / root page → redirect to role home
  if (isRootOrLogin) {
    return NextResponse.redirect(new URL(home, request.url))
  }

  // On a protected route for the wrong role → redirect to correct portal
  // saas_owner is a super-admin and can access any portal
  if (isProtected && role !== 'saas_owner' && !pathname.startsWith(prefix)) {
    return NextResponse.redirect(new URL(home, request.url))
  }

  const host = request.headers.get('host') ?? ''
  supabaseResponse.headers.set('x-company-slug', host.split('.')[0])
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
