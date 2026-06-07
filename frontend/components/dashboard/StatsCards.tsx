'use client'
import { useEffect, useState } from 'react'

interface Stats {
  total: number; inside: number; materials: number; returning: number
  inwardToday: number; outwardToday: number; vehiclesInside: number
}

function Skeleton() {
  return (
    <div className="animate-pulse" style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '20px' }}>
      <div className="h-2 w-20 rounded mb-4" style={{ background: '#F5F5F5' }} />
      <div className="h-10 w-14 rounded mb-2" style={{ background: '#F5F5F5' }} />
      <div className="h-2.5 w-24 rounded" style={{ background: '#F5F5F5' }} />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  live?: boolean
}

function StatCard({ label, value, sub, live }: StatCardProps) {
  return (
    <div
      className="transition-all"
      style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '20px' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#D1D5DB'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#EAEAEA'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <p
        className="text-[10px] font-semibold tracking-widest uppercase mb-3"
        style={{ color: '#9CA3AF' }}
      >
        {label}
      </p>
      <p className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#0A0A0A' }}>
        {value}
      </p>
      {sub && (
        <div className="flex items-center gap-1.5">
          {live && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#10B981', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
            />
          )}
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</span>
        </div>
      )}
    </div>
  )
}

export function StatsCards() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))

    const interval = setInterval(() => {
      fetch('/api/dashboard/stats').then(r => r.json()).then(setStats).catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 phone-lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      </div>
    )
  }

  const inside = stats?.inside ?? 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today's Visitors" value={stats?.total ?? 0}    sub="since midnight"                                          />
        <StatCard label="Currently Inside" value={inside}               sub={inside > 0 ? 'active check-ins' : 'all checked out'} live={inside > 0} />
        <StatCard label="Materials Out"    value={stats?.materials ?? 0} sub="pending return"                                        />
        <StatCard label="Returning"        value={stats?.returning ?? 0} sub="OTP auto-filled"                                      />
      </div>
      <div className="grid grid-cols-1 phone-lg:grid-cols-3 gap-3">
        <StatCard label="Inward Today"    value={stats?.inwardToday    ?? 0} sub="vehicles entered" />
        <StatCard label="Outward Today"   value={stats?.outwardToday   ?? 0} sub="vehicles exited"  />
        <StatCard label="Vehicles Inside" value={stats?.vehiclesInside ?? 0} sub="gate passes open" />
      </div>
    </div>
  )
}
