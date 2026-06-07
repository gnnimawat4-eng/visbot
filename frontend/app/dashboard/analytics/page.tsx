'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Overview {
  visitors_this_period: number
  pct_change: number
  avg_duration_minutes: number
  currently_inside: number
  pending_returns: number
}
interface TrendPoint { date: string; count: number }
interface PurposeItem { name: string; value: number; color: string }
interface HeatmapRow { day: string; hours: { hour: number; count: number }[] }
interface TopHost { name: string; count: number }
interface FlowPoint { date: string; in: number; out: number }
interface GuardStat { name: string; entries_today: number; avg_duration: number }

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function heatColor(count: number, max: number) {
  if (!count) return 'bg-gray-100 dark:bg-gray-800'
  const pct = count / Math.max(max, 1)
  if (pct < 0.25) return 'bg-brand-100 dark:bg-brand-900'
  if (pct < 0.5)  return 'bg-brand-200 dark:bg-brand-700'
  if (pct < 0.75) return 'bg-brand-400 dark:bg-brand-500'
  return 'bg-brand-600 dark:bg-brand-400'
}

function Stat({ label, value, sub, trend }: { label: string; value: string | number; sub?: string; trend?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs prev period
        </p>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">{children}</h2>
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30)
  const [overview, setOverview]       = useState<Overview | null>(null)
  const [trend,    setTrend]          = useState<TrendPoint[]>([])
  const [purpose,  setPurpose]        = useState<PurposeItem[]>([])
  const [heatmap,  setHeatmap]        = useState<HeatmapRow[]>([])
  const [topHosts, setTopHosts]       = useState<TopHost[]>([])
  const [flow,     setFlow]           = useState<FlowPoint[]>([])
  const [guards,   setGuards]         = useState<GuardStat[]>([])

  const params = useCallback(() => {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000
    const now = new Date(Date.now() + IST_OFFSET)
    const to  = now.toISOString().split('T')[0]
    const from = new Date(now.getTime() - range * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    return `from=${from}&to=${to}`
  }, [range])

  useEffect(() => {
    const p = params()
    Promise.all([
      fetch(`/api/analytics/overview?${p}`).then(r => r.json()),
      fetch(`/api/analytics/daily-trend?${p}`).then(r => r.json()),
      fetch(`/api/analytics/purpose?${p}`).then(r => r.json()),
      fetch(`/api/analytics/heatmap?${p}`).then(r => r.json()),
      fetch(`/api/analytics/top-hosts?${p}`).then(r => r.json()),
      fetch(`/api/analytics/material-flow?${p}`).then(r => r.json()),
      fetch(`/api/analytics/guard-performance`).then(r => r.json()),
    ]).then(([ov, tr, pu, hm, th, fl, gp]) => {
      setOverview(ov)
      setTrend(tr.trend ?? [])
      setPurpose(pu.breakdown ?? [])
      setHeatmap(hm.heatmap ?? [])
      setTopHosts(th.top_hosts ?? [])
      setFlow(fl.flow ?? [])
      setGuards(gp.guards ?? [])
    })
  }, [params])

  const maxHeat = Math.max(...(heatmap.flatMap(r => r.hours.map(h => h.count))), 1)

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">All times in IST</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                range === r.days
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Visitors" value={overview?.visitors_this_period ?? '—'} trend={overview?.pct_change} />
        <Stat label="Avg Duration" value={overview ? `${overview.avg_duration_minutes}m` : '—'} sub="per visit" />
        <Stat label="Inside Now" value={overview?.currently_inside ?? '—'} sub="currently checked in" />
        <Stat label="Pending Returns" value={overview?.pending_returns ?? '—'} sub="materials out" />
      </div>

      {/* Visitor Trend + Purpose Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
          <SectionTitle>Visitor Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Visitors']} labelFormatter={l => `Date: ${l}`} />
              <Line type="monotone" dataKey="count" stroke="#16A34A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
          <SectionTitle>Visit Purpose</SectionTitle>
          {purpose.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={purpose} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {purpose.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {purpose.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-gray-600 dark:text-gray-300">{p.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">No data</p>
          )}
        </div>
      </div>

      {/* Material Flow */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
        <SectionTitle>Material Flow (In vs Out)</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={flow.filter((_, i) => i % Math.ceil(flow.length / 20) === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="in"  fill="#16A34A" radius={[3,3,0,0]} name="In" />
            <Bar dataKey="out" fill="#3B82F6" radius={[3,3,0,0]} name="Out" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
        <SectionTitle>Visitor Heatmap (Day × Hour, IST)</SectionTitle>
        {heatmap.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="text-xs border-separate border-spacing-0.5">
              <thead>
                <tr>
                  <th className="w-10 text-gray-400 text-right pr-2" />
                  {Array.from({ length: 24 }, (_, h) => (
                    <th key={h} className="w-7 text-center text-gray-400 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map(row => (
                  <tr key={row.day}>
                    <td className="text-right pr-2 text-gray-500 font-medium">{row.day}</td>
                    {row.hours.map(h => (
                      <td key={h.hour} title={`${row.day} ${h.hour}:00 — ${h.count} visitors`}
                        className={`w-7 h-7 rounded ${heatColor(h.count, maxHeat)}`} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data</p>
        )}
      </div>

      {/* Top Hosts + Guard Performance */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
          <SectionTitle>Top Hosts</SectionTitle>
          {topHosts.length > 0 ? (
            <div className="space-y-3">
              {topHosts.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{h.name}</span>
                      <span className="text-sm font-bold text-brand-600">{h.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${(h.count / (topHosts[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
          <SectionTitle>Guard Performance (Today)</SectionTitle>
          {guards.length > 0 ? (
            <div className="space-y-3">
              {guards.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{g.name}</p>
                    <p className="text-xs text-gray-400">{g.entries_today} entries · avg {g.avg_duration}m per visit</p>
                  </div>
                  <div className="text-2xl font-bold text-brand-600">{g.entries_today}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No guard activity today</p>
          )}
        </div>
      </div>
    </div>
  )
}
