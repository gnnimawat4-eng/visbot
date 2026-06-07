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

  let q = sb
    .from('checkins')
    .select('created_at')
    .gte('created_at', from + 'T00:00:00+05:30')
    .lte('created_at', to   + 'T23:59:59+05:30')

  if (CID) q = q.eq('company_id', CID)
  const { data } = await q

  // Aggregate by date in IST
  const counts: Record<string, number> = {}
  for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) {
    counts[d.toISOString().split('T')[0]] = 0
  }

  for (const row of data ?? []) {
    const dateIST = new Date(new Date((row as Record<string,string>).created_at).getTime() + IST_OFFSET).toISOString().split('T')[0]
    if (dateIST in counts) counts[dateIST]++
  }

  const result = Object.entries(counts).map(([date, count]) => ({ date, count }))
  return NextResponse.json({ trend: result })
}
