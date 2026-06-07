import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const now = new Date(Date.now() + IST_OFFSET)
  const todayStr = now.toISOString().split('T')[0]

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  // Get today's gate passes which have guard_id
  let q = sb
    .from('gate_passes')
    .select('guard_id, created_at, checked_out_at')
    .gte('created_at', todayStr + 'T00:00:00+05:30')
    .not('guard_id', 'is', null)
  if (CID) q = q.eq('company_id', CID)

  const { data: passes } = await q

  // Get guard profiles
  let gq = sb.from('profiles').select('id, full_name').eq('role', 'guard')
  if (CID) gq = gq.eq('company_id', CID)
  const { data: guards } = await gq

  const guardNames: Record<string, string> = {}
  for (const g of guards ?? []) {
    guardNames[g.id] = g.full_name ?? 'Unknown'
  }

  const guardMap: Record<string, { name: string; count: number; totalMinutes: number }> = {}
  for (const row of passes ?? []) {
    const gid = row.guard_id as string
    if (!guardMap[gid]) guardMap[gid] = { name: guardNames[gid] ?? 'Unknown', count: 0, totalMinutes: 0 }
    guardMap[gid].count++
    if (row.checked_out_at && row.created_at) {
      const diff = (new Date(row.checked_out_at).getTime() - new Date(row.created_at).getTime()) / 60000
      if (diff > 0 && diff < 480) guardMap[gid].totalMinutes += diff
    }
  }

  const performance = Object.values(guardMap).map(g => ({
    name:          g.name,
    entries_today: g.count,
    avg_duration:  g.count > 0 ? Math.round(g.totalMinutes / g.count) : 0,
  })).sort((a, b) => b.entries_today - a.entries_today)

  return NextResponse.json({ guards: performance })
}
