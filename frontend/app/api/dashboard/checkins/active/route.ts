import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

/** Returns today's checked-in visitors for the material log dropdown. */
export async function GET() {
  const CID     = await resolveCompanyId()
  const supabase = createAdminClient()
  const today   = new Date().toISOString().split('T')[0]

  let q = supabase
    .from('checkins')
    .select('id, host_name, visitor:visitors(name, phone)')
    .eq('status', 'checked_in')
    .gte('created_at', today)
    .order('created_at', { ascending: false })
    .limit(50)

  if (CID) q = q.eq('company_id', CID)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkins: data ?? [] })
}
