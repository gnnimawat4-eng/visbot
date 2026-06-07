import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const todayIST   = new Date(Date.now() + IST_OFFSET).toISOString().split('T')[0]

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let q = sb
    .from('invitations')
    .select('*, host:profiles(id, full_name, phone)')
    .eq('status', 'pending')
    .eq('scheduled_date', todayIST)
    .order('scheduled_time', { ascending: true, nullsFirst: false })

  if (CID) q = q.eq('company_id', CID)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations: data ?? [] })
}
