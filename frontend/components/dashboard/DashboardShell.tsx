'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar }  from './Topbar'
import { ConfigProvider } from '@/components/config/ConfigProvider'
import { useConfig } from '@/lib/config'
import { BottomNav } from '@/components/ui/BottomNav'
import {
  LayoutDashboard, Users, Package, Settings,
  BarChart2, CheckSquare, Truck, Shield,
  CalendarCheck, Store, AlertTriangle, MessageSquare, Sliders,
} from 'lucide-react'

// ── Admin bottom nav items (mobile only) ────────────────────────────────────

interface NavItem {
  href: string
  exact?: boolean
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  module?: string
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard',           exact: true, icon: LayoutDashboard, label: 'Home'      },
  { href: '/dashboard/visitors',               icon: Users,           label: 'Visitors',  module: 'visitors'  },
  { href: '/dashboard/materials',              icon: Package,         label: 'Materials', module: 'materials' },
  { href: '/dashboard/settings',               icon: Settings,        label: 'Settings'  },
]

const SECONDARY_NAV: NavItem[] = [
  { href: '/dashboard/analytics',    icon: BarChart2,       label: 'Analytics',   module: 'analytics'   },
  { href: '/dashboard/approvals',    icon: CheckSquare,     label: 'Approvals',   module: 'approvals'   },
  { href: '/dashboard/gate-passes',  icon: Truck,           label: 'Gate Passes', module: 'gate_passes' },
  { href: '/dashboard/invitations',  icon: CalendarCheck,   label: 'Invitations', module: 'invitations' },
  { href: '/dashboard/guards',       icon: Shield,          label: 'Guards'                             },
  { href: '/dashboard/vendors',      icon: Store,           label: 'Vendors',     module: 'vendors'     },
  { href: '/dashboard/blacklist',    icon: AlertTriangle,   label: 'Blacklist',   module: 'blacklist'   },
  { href: '/dashboard/sms-log',      icon: MessageSquare,   label: 'SMS Log'                            },
  { href: '/dashboard/settings/customize', icon: Sliders,   label: 'Customize'                         },
]

// ── Module-aware bottom nav (rendered inside ConfigProvider tree) ─────────────

function DashboardBottomNav() {
  const config = useConfig()
  const filter = (items: NavItem[]) =>
    items.filter(item => {
      if (!item.module) return true
      return (config as unknown as Record<string, unknown>)[`module_${item.module}`] !== false
    })
  return <BottomNav primary={filter(PRIMARY_NAV)} secondary={filter(SECONDARY_NAV)} />
}

// ────────────────────────────────────────────────────────────────────────────

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Only auto-collapse on tablet (768-1023px); desktop starts uncollapsed
    const mq = window.matchMedia('(max-width: 767px)')
    setCollapsed(mq.matches)
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const closeDrawer = () => setMobileOpen(false)

  return (
    <ConfigProvider>
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--vb-bg)' }}>

      {/* ── Backdrop: tablet drawer only (md → lg) ───────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 hidden md:block lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* ── Sidebar: hidden on mobile, drawer on tablet, fixed on desktop ─ */}
      <div className={[
        'no-print fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out',
        'hidden md:block',                                        // ← invisible on mobile
        'lg:static lg:z-auto lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          onMobileClose={closeDrawer}
        />
      </div>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--vb-bg)' }}>
          {/*
            On mobile: pb accounts for bottom nav (56px) + safe-area + 16px breathing room.
            On tablet+: normal padding restored via md:pb-8.
          */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 lg:px-8 lg:py-8 content-below-nav md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav — module-filtered ──────────────────────── */}
      <DashboardBottomNav />

    </div>
    </ConfigProvider>
  )
}
