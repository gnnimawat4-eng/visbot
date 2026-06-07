'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, Settings,
  Truck, Shield, ChevronLeft, ChevronRight, X,
  Phone, MessageSquare, BarChart2, CalendarCheck, AlertTriangle,
  Store, CheckSquare, UserCog, Sliders,
} from 'lucide-react'
import { useConfig } from '@/lib/config'

const NAV: {
  href: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  label: string
  module?: string
}[] = [
  { href: '/dashboard',                    icon: LayoutDashboard, label: 'Overview'       },
  { href: '/dashboard/analytics',          icon: BarChart2,       label: 'Analytics',       module: 'analytics'   },
  { href: '/dashboard/visitors',           icon: Users,           label: 'Visitors',         module: 'visitors'    },
  { href: '/dashboard/groups',             icon: Users,           label: 'Groups',           module: 'groups'      },
  { href: '/dashboard/invitations',        icon: CalendarCheck,   label: 'Invitations',      module: 'invitations' },
  { href: '/dashboard/approvals',          icon: CheckSquare,     label: 'Approvals',        module: 'approvals'   },
  { href: '/dashboard/materials',          icon: Package,         label: 'Materials',        module: 'materials'   },
  { href: '/dashboard/gate-passes',        icon: Truck,           label: 'Gate Passes',      module: 'gate_passes' },
  { href: '/dashboard/vendors',            icon: Store,           label: 'Vendors',          module: 'vendors'     },
  { href: '/dashboard/blacklist',          icon: AlertTriangle,   label: 'Blacklist',        module: 'blacklist'   },
  { href: '/dashboard/guards',             icon: Shield,          label: 'Guards'            },
  { href: '/dashboard/hosts',              icon: Phone,           label: 'Hosts'             },
  { href: '/dashboard/sms-log',            icon: MessageSquare,   label: 'SMS Log'           },
  { href: '/dashboard/my-preferences',     icon: UserCog,         label: 'My Preferences'    },
  { href: '/dashboard/settings',           icon: Settings,        label: 'Settings'          },
  { href: '/dashboard/settings/customize', icon: Sliders,         label: 'Customize'         },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, onMobileClose }: Props) {
  const pathname = usePathname()
  const config   = useConfig()

  const visibleNav = NAV.filter(item => {
    if (!item.module) return true
    const key = `module_${item.module}` as keyof typeof config
    return config[key] !== false
  })

  return (
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
          ? (
            <span className="font-bold text-base mx-auto tracking-tight" style={{ color: 'var(--vb-accent)' }}>V</span>
          ) : (
            <span className="font-semibold text-base tracking-tight" style={{ color: 'var(--vb-text)' }}>
              Vis<span style={{ color: 'var(--vb-accent)' }}>Bot</span>
            </span>
          )
        }
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors"
            style={{ color: 'var(--vb-text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        {visibleNav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={onMobileClose}
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
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggle}
        className="hidden lg:flex h-10 items-center justify-center transition-colors flex-shrink-0"
        style={{ borderTop: '1px solid var(--vb-border)', color: 'var(--vb-text-3)' }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
