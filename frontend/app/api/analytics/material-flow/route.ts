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

  let q = sb.from('materials').select('created_at, direction')
    .gte('created_at', from + 'T00:00:00+05:30')
    .lte('created_at', to   + 'T23:59:59+05:30')
  if (CID) q = q.eq('company_id', CID)

  const { data } = await q
  const byDate: Record<string, { date: string; in: number; out: number }> = {}

  for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0]
    byDate[key] = { date: key, in: 0, out: 0 }
  }

  for (const row of data ?? []) {
    const dateIST = new Date(new Date((row as Record<string,string>).created_at).getTime() + IST_OFFSET).toISOString().split('T')[0]
    if (byDate[dateIST]) {
      const dir = (row as Record<string,string>).direction
      if (dir === 'in') byDate[dateIST].in++
      else byDate[dateIST].out++
    }
  }

  return NextResponse.json({ flow: Object.values(byDate) })
}
