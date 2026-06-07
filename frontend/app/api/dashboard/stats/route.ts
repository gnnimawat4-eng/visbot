import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID  = await resolveCompanyId()
  const sb   = createAdminClient()
  // Midnight in IST (UTC+5:30)
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const nowIST = new Date(Date.now() + IST_OFFSET)
  const istDateStr = nowIST.toISOString().split('T')[0]
  const today = new Date(istDateStr + 'T00:00:00+05:30').toISOString()

  const c = (q: ReturnType<typeof sb.from>) => CID ? q.eq('company_id' as never, CID as never) : q

  const [all, inside, mats, inwardToday, outwardToday, vehiclesInside] = await Promise.all([
    c(sb.from('checkins').select('*', { count: 'exact', head: true })).gte('created_at' as never, today),
    c(sb.from('checkins').select('*', { count: 'exact', head: true })).eq('status' as never, 'checked_in'),
    c(sb.from('materials').select('*', { count: 'exact', head: true })).eq('direction' as never, 'out').is('returned_at' as never, null),
    c(sb.from('gate_passes').select('*', { count: 'exact', head: true })).eq('pass_type' as never, 'inward').gte('created_at' as never, today),
    c(sb.from('gate_passes').select('*', { count: 'exact', head: true })).eq('pass_type' as never, 'outward').gte('created_at' as never, today),
    c(sb.from('gate_passes').select('*', { count: 'exact', head: true })).eq('status' as never, 'inside'),
  ])

  return NextResponse.json({
    total:          all.count           ?? 0,
    inside:         inside.count        ?? 0,
    materials:      mats.count          ?? 0,
    returning:      0,
    inwardToday:    inwardToday.count   ?? 0,
    outwardToday:   outwardToday.count  ?? 0,
    vehiclesInside: vehiclesInside.count ?? 0,
  })
}
