'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, UserPlus, UserMinus, Package, Truck,
  Settings, ChevronLeft, ChevronRight,
  LogOut, Shield, Menu, X,
  QrCode, CalendarCheck, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyBranding } from '@/hooks/useCompanyBranding'
import { ConfigProvider } from '@/components/config/ConfigProvider'
import { BottomNav } from '@/components/ui/BottomNav'

// ── Light sidebar constants (matches admin Sidebar.tsx) ──────────────────────
const S = {
  bg:           '#FFFFFF',
  border:       '#EAEAEA',
  text:         '#52525B',
  textActive:   '#0A0A0A',
  activeBg:     '#F4F4F5',
  hoverBg:      '#F4F4F5',
  logo:         '#0A0A0A',
  logoGreen:    '#10B981',
  label:        '#71717A',
  badgeBg:      '#F4F4F5',
  badgeText:    '#0A0A0A',
  iconMuted:    '#9CA3AF',
} as const

// ── Sidebar NAV (tablet + desktop) ──────────────────────────────────────────

const NAV = [
  { href: '/guard',           icon: LayoutDashboard, label: 'Overview'      },
  { href: '/guard/entry',     icon: UserPlus,        label: 'Visitor Entry' },
  { href: '/guard/exit',      icon: UserMinus,       label: 'Visitor Exit'  },
  { href: '/guard/material',  icon: Package,         label: 'Materials'     },
  { href: '/guard/gate-pass', icon: Truck,           label: 'Gate Pass'     },
  { href: '/guard/settings',  icon: Settings,        label: 'Settings'      },
]

// ── Mobile bottom nav ────────────────────────────────────────────────────────

const PRIMARY_NAV = [
  { href: '/guard',          exact: true, icon: LayoutDashboard, label: 'Home'     },
  { href: '/guard/entry',                 icon: UserPlus,        label: 'Entry'    },
  { href: '/guard/exit',                  icon: UserMinus,       label: 'Exit'     },
  { href: '/guard/material',              icon: Package,         label: 'Material' },
]

const SECONDARY_NAV = [
  { href: '/guard/group-entry', icon: Users,         label: 'Group Entry' },
  { href: '/guard/gate-pass',   icon: Truck,         label: 'Gate Pass'   },
  { href: '/guard/scan',        icon: QrCode,        label: 'Scan QR'     },
  { href: '/guard/expected',    icon: CalendarCheck, label: 'Expected'    },
  { href: '/guard/settings',    icon: Settings,      label: 'Settings'    },
]

// ────────────────────────────────────────────────────────────────────────────

export default function GuardShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [guardName,  setGuardName]  = useState('')
  const branding    = useCompanyBranding()
  const companyName = branding?.legal_name || branding?.name || ''
  const logoUrl     = branding?.logo_url ?? null

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setCollapsed(mq.matches)
    const h = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.full_name) setGuardName(d.full_name)
    }).catch(() => {})
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const closeDrawer = () => setMobileOpen(false)

  const Sidebar = (
    <aside
      className={collapsed ? 'w-[60px]' : 'w-[220px]'}
      style={{
        height: '100%',
        background: S.bg,
        borderRight: `1px solid ${S.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease',
        flexShrink: 0,
      }}
    >
      {/* Logo row */}
      <div
        className="h-14 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${S.border}` }}
      >
        {collapsed ? (
          logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logoUrl} alt={companyName} className="mx-auto rounded-md object-cover" style={{ width: 24, height: 24 }} />
            : <Shield size={20} className="mx-auto" style={{ color: S.logoGreen }} />
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt={companyName} className="rounded-md object-cover flex-shrink-0" style={{ width: 24, height: 24 }} />
              : null
            }
            <span className="font-semibold text-[15px] tracking-tight truncate" style={{ color: S.logo }}>
              {companyName || (
                <>Vis<span style={{ color: S.logoGreen }}>Bot</span></>
              )}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: S.badgeBg, color: S.badgeText, border: `1px solid ${S.border}` }}
            >
              Guard
            </span>
          </div>
        )}
        <button
          onClick={closeDrawer}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors ml-1"
          style={{ color: S.label }}
          onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/guard' ? pathname === '/guard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={closeDrawer}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors"
              style={
                active
                  ? { background: S.activeBg, color: S.textActive, fontWeight: 500 }
                  : { color: S.text }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.hoverBg }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer: workspace badge + logout + collapse */}
      <div style={{ borderTop: `1px solid ${S.border}` }}>
        {collapsed ? (
          <div className="flex justify-center py-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="rounded-lg object-cover"
                style={{ width: 28, height: 28 }} />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: S.logoGreen, color: '#fff' }}>
                {(companyName || 'V').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-2 my-2 px-3 py-2.5 rounded-lg flex items-center gap-2.5"
            style={{ border: `1px solid ${S.border}` }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ background: S.logoGreen, color: '#fff' }}>
                {(companyName || 'V').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight truncate" style={{ color: S.logo }}>
                {companyName || '…'}
              </p>
              <p className="text-xs leading-tight mt-0.5 text-gray-500">Workspace</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title="Logout"
          className="w-full flex items-center justify-center gap-2 h-10 text-sm transition-colors"
          style={{ color: S.label }}
          onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.text }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.label }}
        >
          <LogOut size={14} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex w-full h-10 items-center justify-center transition-colors"
          style={{ borderTop: `1px solid ${S.border}`, color: S.label }}
          onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.text }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.label }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )

  return (
    <ConfigProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--vb-bg)' }}>

        {/* Backdrop: tablet only */}
        {mobileOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 hidden md:block lg:hidden" onClick={closeDrawer} />
        )}

        {/* Sidebar: hidden mobile, drawer tablet, fixed desktop */}
        <div className={[
          'fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out',
          'hidden md:block',
          'lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}>
          {Sidebar}
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header
            className="h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
            style={{ background: S.bg, borderBottom: `1px solid ${S.border}` }}
          >
            <div className="flex items-center gap-3">
              {/* Hamburger: tablet only */}
              <button
                onClick={() => setMobileOpen(true)}
                className="hidden md:flex lg:hidden p-2 rounded-lg transition-colors -ml-1 items-center justify-center"
                style={{ color: S.label }}
                onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={companyName} className="rounded-md object-cover flex-shrink-0"
                    style={{ width: 22, height: 22 }} />
                )}
                <div>
                  <p className="text-sm font-semibold leading-none" style={{ color: S.logo }}>
                    {companyName || 'VisBot'}
                  </p>
                  {guardName && (
                    <p className="text-xs mt-0.5" style={{ color: S.label }}>{guardName}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={logout}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: S.iconMuted }}
                title="Sign out"
                onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.text }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.iconMuted }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto" style={{ background: 'var(--vb-bg)' }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 content-below-nav md:pb-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav primary={PRIMARY_NAV} secondary={SECONDARY_NAV} />

      </div>
    </ConfigProvider>
  )
}
