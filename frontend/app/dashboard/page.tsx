import { StatsCards }      from '@/components/dashboard/StatsCards'
import { LiveFeed }        from '@/components/dashboard/LiveFeed'
import { MaterialTracker } from '@/components/dashboard/MaterialTracker'
import { VisitChart }      from '@/components/dashboard/VisitChart'

export default function DashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--vb-text)' }}>Overview</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--vb-text-3)' }}>Today&apos;s activity at a glance</p>
      </div>
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <LiveFeed />
        <div className="flex flex-col gap-6">
          <MaterialTracker />
          <VisitChart />
        </div>
      </div>
    </>
  )
}
