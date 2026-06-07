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

  let q = sb.from('checkins').select('purpose')
    .gte('created_at', from + 'T00:00:00+05:30')
    .lte('created_at', to   + 'T23:59:59+05:30')
  if (CID) q = q.eq('company_id', CID)

  const { data } = await q
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const p = (row as Record<string,string>).purpose ?? 'other'
    counts[p] = (counts[p] ?? 0) + 1
  }

  const COLORS: Record<string, string> = {
    meeting:  '#16A34A', delivery: '#3B82F6', interview: '#8B5CF6',
    official: '#F59E0B', other:    '#6B7280',
  }

  const result = Object.entries(counts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[name] ?? '#6B7280',
  })).sort((a, b) => b.value - a.value)

  return NextResponse.json({ breakdown: result })
}
