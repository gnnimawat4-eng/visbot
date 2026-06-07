import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const date_from = searchParams.get('date_from')
  const date_to   = searchParams.get('date_to')
  const host_id   = searchParams.get('host_id')

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let q = sb
    .from('invitations')
    .select('*, host:profiles(id, full_name, phone)')
    .order('scheduled_date', { ascending: false })

  if (CID)       q = q.eq('company_id', CID)
  if (status)    q = q.eq('status', status)
  if (date_from) q = q.gte('scheduled_date', date_from)
  if (date_to)   q = q.lte('scheduled_date', date_to)
  if (host_id)   q = q.eq('host_id', host_id)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    visitor_name, visitor_phone, visitor_email, visitor_company,
    purpose, notes, scheduled_date, scheduled_time,
    expected_duration_minutes, host_id, host_name,
  } = body

  if (!visitor_name || !visitor_phone || !purpose || !scheduled_date) {
    return NextResponse.json(
      { error: 'visitor_name, visitor_phone, purpose, scheduled_date required' },
      { status: 400 },
    )
  }

  const CID     = await resolveCompanyId()
  const sbUser  = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb      = createAdminClient()

  // Resolve host_id from host_name text if not provided as UUID
  let resolvedHostId: string = host_id ?? user?.id ?? ''
  if (!host_id && host_name) {
    const { data: profiles } = await sb.from('profiles').select('id')
      .ilike('full_name', `%${host_name}%`)
      .eq('company_id', CID ?? '')
      .limit(1)
    if (profiles && profiles.length > 0) resolvedHostId = profiles[0].id
  }

  const { data, error } = await sb
    .from('invitations')
    .insert({
      company_id:                CID,
      visitor_name,
      visitor_phone,
      visitor_email:             visitor_email   || null,
      visitor_company:           visitor_company || null,
      purpose,
      notes:                     notes           || null,
      scheduled_date,
      scheduled_time:            scheduled_time  || null,
      expected_duration_minutes: expected_duration_minutes || 60,
      host_id:                   resolvedHostId,
      created_by:                user?.id        || null,
    })
    .select('*, host:profiles(id, full_name, phone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitation: data }, { status: 201 })
}
