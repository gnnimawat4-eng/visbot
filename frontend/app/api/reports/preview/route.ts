import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()
  const tomorrow = new Date(today.getTime() + 86400000).toISOString()

  const [checkinsRes, materialsRes, pendingRes] = await Promise.all([
    sb.from('checkins').select('id, status, created_at, checked_out_at, host_name, purpose').eq('company_id', CID!).gte('created_at', todayISO).lt('created_at', tomorrow),
    sb.from('materials').select('id, direction, value_inr, is_returnable, return_status').eq('company_id', CID!).gte('created_at', todayISO).lt('created_at', tomorrow),
    sb.from('materials').select('id, item_name').eq('company_id', CID!).eq('is_returnable', true).eq('return_status', 'pending'),
  ])

  const checkins = checkinsRes.data ?? []
  const materials = materialsRes.data ?? []

  const totalToday = checkins.length
  const currentlyInside = checkins.filter(c => c.status === 'checked_in').length
  const materialsIn = materials.filter(m => m.direction === 'in').length
  const materialsOut = materials.filter(m => m.direction === 'out').length
  const pendingReturns = pendingRes.data?.length ?? 0

  // Top hosts
  const hostCounts: Record<string, number> = {}
  checkins.forEach(c => { if (c.host_name) hostCounts[c.host_name] = (hostCounts[c.host_name] || 0) + 1 })
  const topHosts = Object.entries(hostCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    date: today.toISOString().split('T')[0],
    total_visitors: totalToday,
    currently_inside: currentlyInside,
    materials_in: materialsIn,
    materials_out: materialsOut,
    pending_returns: pendingReturns,
    top_hosts: topHosts,
  })
}
