'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserPlus, UserMinus, Package, Truck,
  Users, QrCode, CalendarCheck,
} from 'lucide-react'
import { format } from 'date-fns'

interface Stats {
  total: number; inside: number; materials: number
  inwardToday: number; outwardToday: number
}

const ACTIONS = [
  {
    href:      '/guard/entry',
    icon:      UserPlus,
    label:     'Visitor Entry',
    sub:       'Check in a visitor',
    badgeKey:  null as null | keyof Stats,
  },
  {
    href:      '/guard/group-entry',
    icon:      Users,
    label:     'Group Entry',
    sub:       'Check in a group',
    badgeKey:  null as null | keyof Stats,
  },
  {
    href:      '/guard/exit',
    icon:      UserMinus,
    label:     'Visitor Exit',
    sub:       'Check out',
    badgeKey:  'inside' as keyof Stats,
  },
  {
    href:      '/guard/material',
    icon:      Package,
    label:     'Log Material',
    sub:       'IN / OUT items',
    badgeKey:  null as null | keyof Stats,
  },
  {
    href:      '/guard/gate-pass',
    icon:      Truck,
    label:     'Gate Pass',
    sub:       'Vehicle challan',
    badgeKey:  null as null | keyof Stats,
  },
  {
    href:      '/guard/scan',
    icon:      QrCode,
    label:     'Scan QR',
    sub:       'Pre-approved visitor',
    badgeKey:  null as null | keyof Stats,
  },
  {
    href:      '/guard/expected',
    icon:      CalendarCheck,
    label:     'Expected Today',
    sub:       'Invited visitors',
    badgeKey:  null as null | keyof Stats,
  },
]

export default function GuardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const inside = stats?.inside ?? 0

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--vb-text-3)' }}>
          {format(new Date(), 'EEEE, dd MMM yyyy')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--vb-text)' }}>
          Guard Dashboard
        </h1>
      </div>

      {/* Quick stats bar */}
      <div
        className="rounded-lg px-5 py-3 mb-6 flex items-center gap-6 flex-wrap"
        style={{ border: '1px solid var(--vb-border)', background: 'var(--vb-bg-card)' }}
      >
        {[
          { label: 'Today',    val: stats?.total ?? 0 },
          { label: 'Inside',   val: inside, accent: true },
          { label: 'Materials',val: stats?.materials ?? 0 },
          { label: 'Vehicles', val: (stats?.inwardToday ?? 0) + (stats?.outwardToday ?? 0) },
        ].map(({ label, val, accent }) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: accent ? 'var(--vb-accent)' : 'var(--vb-text)' }}
            >
              {val}
            </span>
            <span className="text-xs" style={{ color: 'var(--vb-text-3)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Action grid */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--vb-text-3)' }}>Quick actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          {ACTIONS.map(({ href, icon: Icon, label, sub, badgeKey }) => {
            const badgeVal = badgeKey && stats ? (stats[badgeKey] as number) : null
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'rounded-lg transition-colors active:scale-[.98] select-none',
                  // Mobile: vertical stack with larger icon
                  'flex flex-col items-center justify-center gap-2.5 py-5 px-3 text-center min-h-[100px]',
                  // Tablet+: horizontal row
                  'sm:flex-row sm:justify-start sm:items-center sm:gap-3.5 sm:py-3.5 sm:px-4 sm:text-left sm:min-h-0',
                ].join(' ')}
                style={{ border: '1px solid var(--vb-border)', background: 'var(--vb-bg-card)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--vb-border-strong, var(--vb-text-3))'; e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--vb-border)'; e.currentTarget.style.background = 'var(--vb-bg-card)'; }}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center rounded-md flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8"
                  style={{ background: 'var(--vb-bg-hover)' }}
                >
                  <Icon size={18} className="sm:hidden" style={{ color: 'var(--vb-text-2)' }} />
                  <Icon size={15} className="hidden sm:block" style={{ color: 'var(--vb-text-2)' }} />
                </div>
                {/* Text */}
                <div className="min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <p className="text-sm font-medium" style={{ color: 'var(--vb-text)' }}>{label}</p>
                    {badgeVal != null && badgeVal > 0 && (
                      <span className="text-[10px] font-semibold bg-orange-500 text-white rounded-sm px-1 py-px leading-none">
                        {badgeVal}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--vb-text-3)' }}>{sub}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
