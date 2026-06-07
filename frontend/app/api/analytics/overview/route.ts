import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

const IST = (d: Date) => new Date(d.getTime() + 5.5 * 60 * 60 * 1000)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const now      = IST(new Date())
  const todayStr = now.toISOString().split('T')[0]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0)

  const from = searchParams.get('from') ?? monthStart.toISOString().split('T')[0]
  const to   = searchParams.get('to')   ?? todayStr

  let qThis = sb.from('checkins').select('*', { count: 'exact', head: true })
    .gte('created_at', from + 'T00:00:00+05:30')
    .lte('created_at', to + 'T23:59:59+05:30')
  if (CID) qThis = qThis.eq('company_id', CID)

  let qLast = sb.from('checkins').select('*', { count: 'exact', head: true })
    .gte('created_at', lastMonthStart.toISOString().split('T')[0] + 'T00:00:00+05:30')
    .lte('created_at', lastMonthEnd.toISOString().split('T')[0] + 'T23:59:59+05:30')
  if (CID) qLast = qLast.eq('company_id', CID)

  let qInside = sb.from('checkins').select('*', { count: 'exact', head: true }).eq('status', 'checked_in')
  if (CID) qInside = qInside.eq('company_id', CID)

  let qPending = sb.from('materials').select('*', { count: 'exact', head: true })
    .eq('is_returnable', true)
    .eq('return_status', 'pending')
  if (CID) qPending = qPending.eq('company_id', CID)

  const [thisMonth, lastMonth, inside, pendingReturns] = await Promise.all([qThis, qLast, qInside, qPending])

  const thisMonthCount = thisMonth.count ?? 0
  const lastMonthCount = lastMonth.count ?? 0
  const pctChange = lastMonthCount > 0
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : 0

  // Avg visit duration
  let durQ = sb.from('checkins').select('created_at, checked_out_at')
    .eq('status', 'checked_out')
    .not('checked_out_at', 'is', null)
    .limit(200)
  if (CID) durQ = durQ.eq('company_id', CID)
  const { data: durations } = await durQ

  const avgDuration = durations && durations.length > 0
    ? Math.round(durations.reduce((s: number, r) => {
        const diff = (new Date(r.checked_out_at!).getTime() - new Date(r.created_at!).getTime()) / 60000
        return s + (diff > 0 && diff < 480 ? diff : 0)
      }, 0) / durations.length)
    : 0

  return NextResponse.json({
    visitors_this_period: thisMonthCount,
    pct_change:           pctChange,
    avg_duration_minutes: avgDuration,
    currently_inside:     inside.count ?? 0,
    pending_returns:      pendingReturns.count ?? 0,
  })
}
