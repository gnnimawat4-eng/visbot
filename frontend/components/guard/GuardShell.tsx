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
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ConfigProvider } from '@/components/config/ConfigProvider'
import { BottomNav } from '@/components/ui/BottomNav'

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
  { href: '/guard/group-entry', icon: Users,        label: 'Group Entry' },
  { href: '/guard/gate-pass',   icon: Truck,        label: 'Gate Pass'   },
  { href: '/guard/scan',        icon: QrCode,       label: 'Scan QR'     },
  { href: '/guard/expected',    icon: CalendarCheck, label: 'Expected'   },
  { href: '/guard/settings',    icon: Settings,     label: 'Settings'    },
]

// ────────────────────────────────────────────────────────────────────────────

export default function GuardShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [guardName,   setGuardName]   = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    // Only collapse sidebar on true mobile (<768px). Tablet shows full drawer.
    const mq = window.matchMedia('(max-width: 767px)')
    setCollapsed(mq.matches)
    const h = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.full_name)     setGuardName(d.full_name)
      if (d?.company?.name) setCompanyName(d.company.name)
    }).catch(() => {})
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const closeDrawer = () => setMobileOpen(false)

  const Sidebar = (
    <aside
      className={collapsed ? 'w-16' : 'w-64 sm:w-56'}
      style={{
        height: '100%',
        background: 'var(--vb-bg-sidebar)',
        borderRight: '1px solid var(--vb-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms',
      }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--vb-border)' }}>
        {collapsed
          ? <Shield size={20} className="mx-auto" style={{ color: 'var(--vb-accent)' }} />
          : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg" style={{ color: 'var(--vb-text)' }}>
                Vis<span style={{ color: 'var(--vb-accent)' }}>Bot</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  background: 'var(--vb-bg-active)',
                  color: 'var(--vb-accent)',
                  borderColor: 'var(--vb-accent-ring)',
                }}>
                Guard
              </span>
            </div>
          )
        }
        <button onClick={closeDrawer}
          className="lg:hidden p-1 rounded transition-colors"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--vb-text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--vb-text-3)'; }}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/guard' ? pathname === '/guard' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined} onClick={closeDrawer}
              className="flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm transition-colors"
              style={active
                ? { background: 'var(--vb-bg-active)', color: 'var(--vb-accent)', fontWeight: 500 }
                : { color: 'var(--vb-text-2)' }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--vb-border)' }}>
        {!collapsed && (guardName || companyName) && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--vb-border)' }}>
            {guardName   && <p className="text-sm font-medium truncate" style={{ color: 'var(--vb-text)' }}>{guardName}</p>}
            {companyName && <p className="text-xs truncate" style={{ color: 'var(--vb-text-3)' }}>{companyName}</p>}
          </div>
        )}
        <button onClick={logout} title="Logout"
          className="w-full flex items-center justify-center gap-2 h-11 text-sm transition-colors"
          style={{ borderTop: '1px solid var(--vb-border)', color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}>
          <LogOut size={15} />{!collapsed && 'Logout'}
        </button>
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex w-full h-10 items-center justify-center transition-colors"
          style={{ borderTop: '1px solid var(--vb-border)', color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
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
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
          style={{ background: 'var(--vb-bg-sidebar)', borderBottom: '1px solid var(--vb-border)' }}>
          <div className="flex items-center gap-3">
            {/* Hamburger: tablet only */}
            <button onClick={() => setMobileOpen(true)}
              className="hidden md:flex lg:hidden p-2 rounded-lg transition-colors -ml-1 items-center justify-center"
              style={{ color: 'var(--vb-text-3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--vb-text)' }}>
                {companyName || 'VisBot'}
              </p>
              {guardName && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--vb-text-3)' }}>{guardName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={logout}
              className="flex items-center gap-1.5 text-sm p-2 rounded-lg transition-colors"
              style={{ color: 'var(--vb-text-3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}>
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
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
