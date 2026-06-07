import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID     = await resolveCompanyId()
  const supabase = createAdminClient()
  let q = supabase
    .from('checkins')
    .select('*, visitor:visitors(name, phone)')
    .order('created_at', { ascending: false })
    .limit(30)

  if (CID) q = q.eq('company_id', CID)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feed: data ?? [] })
}
