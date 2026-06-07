'use client'
import { useEffect, useState } from 'react'

interface Stats {
  total: number; inside: number; materials: number; returning: number
  inwardToday: number; outwardToday: number; vehiclesInside: number
}

function Skeleton() {
  return (
    <div className="rounded-lg p-5 animate-pulse" style={{ border: '1px solid var(--vb-border)', background: 'var(--vb-bg-card)' }}>
      <div className="h-3 w-28 rounded mb-4" style={{ background: 'var(--vb-bg-hover)' }} />
      <div className="h-8 w-16 rounded mb-2" style={{ background: 'var(--vb-bg-hover)' }} />
      <div className="h-3 w-20 rounded"     style={{ background: 'var(--vb-bg-hover)' }} />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  trend?: { value: string; up?: boolean }
}

function StatCard({ label, value, sub, trend }: StatCardProps) {
  return (
    <div className="rounded-lg p-5" style={{ border: '1px solid var(--vb-border)', background: 'var(--vb-bg-card)' }}>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--vb-text-3)' }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--vb-text)' }}>
          {value}
        </p>
        {trend && (
          <span className={`text-xs font-medium ${trend.up ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs" style={{ color: 'var(--vb-text-3)' }}>{sub}</p>}
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
      {/* Visitor stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Today's visitors"
          value={stats?.total ?? 0}
          sub="since midnight"
        />
        <StatCard
          label="Currently inside"
          value={inside}
          sub={inside === 1 ? 'active check-in' : 'active check-ins'}
          trend={inside > 0 ? { value: 'live', up: true } : undefined}
        />
        <StatCard
          label="Materials out"
          value={stats?.materials ?? 0}
          sub="pending return"
        />
        <StatCard
          label="Returning visitors"
          value={stats?.returning ?? 0}
          sub="OTP auto-filled"
        />
      </div>

      {/* Vehicle stats */}
      <div className="grid grid-cols-1 phone-lg:grid-cols-3 gap-3">
        <StatCard label="Inward today"    value={stats?.inwardToday    ?? 0} sub="vehicles entered" />
        <StatCard label="Outward today"   value={stats?.outwardToday   ?? 0} sub="vehicles exited"  />
        <StatCard label="Vehicles inside" value={stats?.vehiclesInside ?? 0} sub="gate passes open" />
      </div>
    </div>
  )
}
