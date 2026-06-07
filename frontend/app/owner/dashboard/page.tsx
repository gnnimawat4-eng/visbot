'use client'
import { useEffect, useState } from 'react'
import { Building2, Users, UserCheck, Truck } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Stats {
  companies: number
  users: number
  checkinsToday: number
  gatePassesToday: number
  recentCompanies: Array<{ id: string; name: string; slug: string; plan: string; active: boolean; created_at: string }>
}

const PLAN_COLOR: Record<string, string> = {
  starter:    'bg-gray-100 text-gray-600',
  pro:        'bg-brand-50 text-brand-600',
  enterprise: 'bg-purple-50 text-purple-600',
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <Icon size={16} className={accent ? 'text-brand-500' : 'text-gray-300 dark:text-gray-600'} />
      </div>
      <p className={`text-3xl font-bold ${accent ? 'text-brand-500' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
    </div>
  )
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/owner/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  if (!stats) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">System Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{format(new Date(), 'EEEE, dd MMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active companies"   value={stats.companies}       icon={Building2} />
        <StatCard label="Total active users" value={stats.users}           icon={Users}     />
        <StatCard label="Check-ins today"    value={stats.checkinsToday}   icon={UserCheck} accent />
        <StatCard label="Gate passes today"  value={stats.gatePassesToday} icon={Truck}     />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent companies</h2>
          <Link href="/owner/companies" className="text-xs text-brand-500 hover:underline">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {['Name', 'Slug', 'Plan', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {stats.recentCompanies.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  <Link href={`/owner/companies/${c.id}`} className="hover:text-brand-500">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLOR[c.plan] ?? PLAN_COLOR.starter}`}>{c.plan}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
