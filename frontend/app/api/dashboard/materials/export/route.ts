import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const CID = await resolveCompanyId()
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const supabase = createAdminClient()
  let q = supabase
    .from('materials')
    .select('*, checkin:checkins(host_name, visitor:visitors(name, phone))')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (CID)  q = q.eq('company_id', CID)
  if (from) q = q.gte('created_at', new Date(from).toISOString())
  if (to) {
    const end = new Date(to); end.setDate(end.getDate() + 1)
    q = q.lt('created_at', end.toISOString())
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data ?? [] })
}
