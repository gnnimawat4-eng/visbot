import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb  = createAdminClient()
  const CID = await resolveCompanyId()

  const { data, error } = await sb
    .from('blacklist')
    .select('*, added_by_profile:profiles!blacklist_added_by_fkey(full_name), attempts:blacklist_attempts(id, attempt_time, attempted_name, attempted_phone, guard:profiles(full_name), notes)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && data.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ entry: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const sb   = createAdminClient()
  const CID  = await resolveCompanyId()

  const { data: existing } = await sb.from('blacklist').select('company_id').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && existing.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await sb
    .from('blacklist')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
