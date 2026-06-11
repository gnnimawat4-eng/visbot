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
import { useCompanyBranding } from '@/hooks/useCompanyBranding'

const S = {
  bg:           'var(--vb-bg-sidebar)',
  border:       'var(--vb-border)',
  text:         'var(--vb-text-2)',
  textActive:   'var(--vb-text)',
  activeBg:     'var(--vb-bg-active)',
  hoverBg:      'var(--vb-bg-hover)',
  logo:         'var(--vb-text)',
  logoGreen:    '#10B981',
  label:        'var(--vb-text-3)',
  badgeBg:      'var(--vb-bg-card)',
  collapseText: 'var(--vb-text-3)',
}

interface NavItem {
  href: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  label: string
  module?: string
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard',           icon: LayoutDashboard, label: 'Overview'  },
      { href: '/dashboard/analytics', icon: BarChart2,       label: 'Analytics', module: 'analytics' },
    ],
  },
  {
    label: 'VISITORS',
    items: [
      { href: '/dashboard/visitors',    icon: Users,         label: 'Visitors',    module: 'visitors'    },
      { href: '/dashboard/groups',      icon: Users,         label: 'Groups',      module: 'groups'      },
      { href: '/dashboard/invitations', icon: CalendarCheck, label: 'Invitations', module: 'invitations' },
      { href: '/dashboard/approvals',   icon: CheckSquare,   label: 'Approvals',   module: 'approvals'   },
    ],
  },
  {
    label: 'LOGISTICS',
    items: [
      { href: '/dashboard/materials',   icon: Package,       label: 'Materials',   module: 'materials'   },
      { href: '/dashboard/gate-passes', icon: Truck,         label: 'Gate Passes', module: 'gate_passes' },
      { href: '/dashboard/vendors',     icon: Store,         label: 'Vendors',     module: 'vendors'     },
    ],
  },
  {
    label: 'SECURITY',
    items: [
      { href: '/dashboard/blacklist', icon: AlertTriangle, label: 'Blacklist', module: 'blacklist' },
      { href: '/dashboard/guards',    icon: Shield,        label: 'Guards'    },
      { href: '/dashboard/hosts',     icon: Phone,         label: 'Hosts'     },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/dashboard/sms-log',            icon: MessageSquare, label: 'SMS Log'        },
      { href: '/dashboard/my-preferences',     icon: UserCog,       label: 'My Preferences' },
      { href: '/dashboard/settings',           icon: Settings,      label: 'Settings'       },
      { href: '/dashboard/settings/customize', icon: Sliders,       label: 'Customize'      },
    ],
  },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, onMobileClose }: Props) {
  const pathname = usePathname()
  const config   = useConfig()
  const branding = useCompanyBranding()
  const displayName = branding?.legal_name || branding?.name || ''

  function isVisible(item: NavItem) {
    if (!item.module) return true
    const key = `module_${item.module}` as keyof typeof config
    return config[key] !== false
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  const initial = displayName?.[0]?.toUpperCase() ?? 'V'

  return (
    <aside
      className={`no-print ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
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
          <span className="font-bold text-base mx-auto" style={{ color: S.logoGreen }}>V</span>
        ) : (
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: S.logo }}>
            Vis<span style={{ color: S.logoGreen }}>Bot</span>
          </span>
        )}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
            style={{ color: S.label }}
            onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {SECTIONS.map(section => {
          const visible = section.items.filter(isVisible)
          if (visible.length === 0) return null
          return (
            <div key={section.label}>
              {!collapsed && (
                <p
                  className="px-2 mb-1 text-xs font-medium tracking-wider uppercase select-none"
                  style={{ color: S.label }}
                >
                  {section.label}
                </p>
              )}
              <div className="space-y-px">
                {visible.map(item => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={onMobileClose}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors"
                      style={
                        active
                          ? { background: S.activeBg, color: S.textActive, fontWeight: 500 }
                          : { color: S.text }
                      }
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.hoverBg }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <Icon size={16} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Workspace badge */}
      {collapsed ? (
        <div className="flex justify-center mb-2">
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={displayName} className="rounded-lg object-cover"
              style={{ width: 28, height: 28 }} />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: S.logoGreen, color: '#fff' }}
            >
              {initial}
            </div>
          )}
        </div>
      ) : (
        <div
          className="mx-2 mb-2 px-3 py-2.5 rounded-lg flex items-center gap-2.5"
          style={{ background: S.badgeBg, border: `1px solid ${S.border}` }}
        >
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={displayName}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ border: '1px solid var(--vb-border)' }} />
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{ background: S.logoGreen, color: '#fff' }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate" style={{ color: S.logo }}>
              {displayName || '…'}
            </p>
            <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--vb-text-3)' }}>Workspace</p>
          </div>
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        className="hidden lg:flex h-10 items-center justify-center flex-shrink-0 transition-colors"
        style={{ borderTop: `1px solid ${S.border}`, color: S.collapseText }}
        title={collapsed ? 'Expand' : 'Collapse'}
        onMouseEnter={e => { e.currentTarget.style.background = S.hoverBg; e.currentTarget.style.color = S.label }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.collapseText }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}
