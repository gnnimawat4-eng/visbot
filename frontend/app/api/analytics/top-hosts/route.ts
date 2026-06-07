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

  let q = sb.from('checkins').select('host_name')
    .gte('created_at', from + 'T00:00:00+05:30')
    .lte('created_at', to   + 'T23:59:59+05:30')
    .not('host_name', 'is', null)
  if (CID) q = q.eq('company_id', CID)

  const { data } = await q
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const h = (row as Record<string,string>).host_name ?? ''
    if (h) counts[h] = (counts[h] ?? 0) + 1
  }

  const result = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return NextResponse.json({ top_hosts: result })
}
