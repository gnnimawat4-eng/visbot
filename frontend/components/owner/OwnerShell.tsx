'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Settings, Layers,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
        background: 'var(--vb-bg-sidebar)',
        borderRight: '1px solid var(--vb-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 180ms ease',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--vb-border)' }}
      >
        {collapsed
          ? <span className="font-bold text-base mx-auto tracking-tight" style={{ color: 'var(--vb-accent)' }}>V</span>
          : <span className="font-semibold text-base tracking-tight" style={{ color: 'var(--vb-text)' }}>
              Vis<span style={{ color: 'var(--vb-accent)' }}>Bot</span>
            </span>
        }
        <button
          onClick={closeDrawer}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
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
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors"
              style={
                active
                  ? { background: 'var(--vb-bg-active)', color: 'var(--vb-text)', fontWeight: 500 }
                  : { color: 'var(--vb-text-2)' }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={15} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: logout + collapse */}
      <div style={{ borderTop: '1px solid var(--vb-border)' }}>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 h-10 text-sm transition-colors"
          style={{ color: 'var(--vb-text-3)' }}
          title="Logout"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}
        >
          <LogOut size={14} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex w-full h-10 items-center justify-center transition-colors"
          style={{ borderTop: '1px solid var(--vb-border)', color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}
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
        {/* Top bar */}
        <header
          className="h-14 flex items-center px-4 sm:px-6 flex-shrink-0 gap-3"
          style={{ background: 'var(--vb-bg-sidebar)', borderBottom: '1px solid var(--vb-border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="hidden md:flex lg:hidden items-center justify-center w-8 h-8 rounded-md transition-colors -ml-1"
            style={{ color: 'var(--vb-text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Menu size={16} />
          </button>
          <span className="text-xs font-medium flex-1" style={{ color: 'var(--vb-text-3)' }}>
            Owner Console
          </span>
          <ThemeToggle />
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
