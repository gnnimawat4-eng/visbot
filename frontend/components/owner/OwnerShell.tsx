'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Settings, Layers,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Light sidebar constants (matches admin Sidebar.tsx) ──────────────────────
const S = {
  bg:         '#FFFFFF',
  border:     '#EAEAEA',
  text:       '#52525B',
  textActive: '#0A0A0A',
  activeBg:   '#F4F4F5',
  hoverBg:    '#F4F4F5',
  logo:       '#0A0A0A',
  logoGreen:  '#10B981',
  label:      '#71717A',
  badgeBg:    '#F4F4F5',
  badgeText:  '#0A0A0A',
  iconMuted:  '#9CA3AF',
} as const

const NAV = [
  { href: '/owner/dashboard', icon: LayoutDashboard, label: 'Overview'  },
  { href: '/owner/companies', icon: Building2,        label: 'Companies' },
  { href: '/owner/templates', icon: Layers,           label: 'Templates' },
  { href: '/owner/settings',  icon: Settings,         label: 'Settings'  },
]

export default function OwnerShell({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setCollapsed(mq.matches)
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
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
        transition: 'width 180ms ease',
        flexShrink: 0,
      }}
    >
      {/* Logo row */}
      <div
        className="h-14 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${S.border}` }}
      >
        {collapsed ? (
          <span className="font-bold text-base mx-auto tracking-tight" style={{ color: S.logoGreen }}>V</span>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold text-[15px] tracking-tight" style={{ color: S.logo }}>
              Vis<span style={{ color: S.logoGreen }}>Bot</span>
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: S.badgeBg, color: S.badgeText, border: `1px solid ${S.border}` }}
            >
              Owner
            </span>
          </div>
        )}
        <button
          onClick={closeDrawer}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style={{ color: S.label }}
          onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-px">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={closeDrawer}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors"
              style={
                active
                  ? { background: S.activeBg, color: S.textActive, fontWeight: 500 }
                  : { color: S.text }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.hoverBg }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={15} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: logout + collapse */}
      <div style={{ borderTop: `1px solid ${S.border}` }}>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 h-10 text-sm transition-colors"
          style={{ color: S.label }}
          title="Logout"
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--vb-bg)' }}>
      {/* Tablet backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 hidden md:block lg:hidden" onClick={closeDrawer} />
      )}

      {/* Sidebar */}
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
          className="h-14 flex items-center px-4 sm:px-6 flex-shrink-0 gap-3"
          style={{ background: S.bg, borderBottom: `1px solid ${S.border}` }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="hidden md:flex lg:hidden items-center justify-center w-8 h-8 rounded-md transition-colors -ml-1"
            style={{ color: S.label }}
            onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Menu size={16} />
          </button>
          <span className="text-sm font-medium flex-1" style={{ color: S.logo }}>
            Owner Console
          </span>
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
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--vb-bg)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
