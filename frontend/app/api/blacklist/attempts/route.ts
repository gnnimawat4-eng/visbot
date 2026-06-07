import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let q = sb
    .from('blacklist_attempts')
    .select('*, blacklist_entry:blacklist(id, name, severity, photo_url), guard:profiles(full_name)')
    .order('attempt_time', { ascending: false })
    .limit(100)

  if (CID) q = q.eq('company_id', CID)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attempts: data ?? [] })
}
