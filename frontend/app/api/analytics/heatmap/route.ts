import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const now = new Date(Date.now() + IST_OFFSET)
  const from = searchParams.get('from') ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to   = searchParams.get('to')   ?? now.toISOString().split('T')[0]

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let q = sb.from('checkins').select('created_at')
    .gte('created_at', from + 'T00:00:00+05:30')
    .lte('created_at', to   + 'T23:59:59+05:30')
  if (CID) q = q.eq('company_id', CID)

  const { data } = await q

  // Build 7×24 grid: day[0-6] × hour[0-23]
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const row of data ?? []) {
    const d = new Date(new Date((row as Record<string,string>).created_at).getTime() + IST_OFFSET)
    const dow  = d.getDay()   // 0=Sun
    const hour = d.getHours()
    grid[dow][hour]++
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const heatmap = grid.map((row, di) => ({
    day: DAYS[di],
    hours: row.map((count, hour) => ({ hour, count })),
  }))

  // Peak hour/day
  let maxCount = 0, peakDay = 0, peakHour = 0
  grid.forEach((row, di) => row.forEach((count, hi) => { if (count > maxCount) { maxCount = count; peakDay = di; peakHour = hi } }))

  return NextResponse.json({
    heatmap,
    peak: { day: DAYS[peakDay], hour: peakHour, count: maxCount },
  })
}
