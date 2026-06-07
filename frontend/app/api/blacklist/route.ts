import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status') ?? 'active'
  const severity = searchParams.get('severity')
  const q        = searchParams.get('q')

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let query = sb
    .from('blacklist')
    .select('*, added_by_profile:profiles!blacklist_added_by_fkey(full_name)')
    .order('added_at', { ascending: false })

  if (CID)      query = query.eq('company_id', CID)
  if (status)   query = query.eq('status', status)
  if (severity) query = query.eq('severity', severity)
  if (q)        query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blacklist: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, id_proof_type, id_proof_number, severity, reason, incident_date, notes, photo_url } = body

  if (!name || !reason) return NextResponse.json({ error: 'name and reason required' }, { status: 400 })

  const CID    = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb     = createAdminClient()

  const { data, error } = await sb
    .from('blacklist')
    .insert({
      company_id:      CID,
      name,
      phone:           phone          || null,
      id_proof_type:   id_proof_type  || null,
      id_proof_number: id_proof_number || null,
      severity:        severity        || 'medium',
      reason,
      incident_date:   incident_date  || null,
      notes:           notes          || null,
      photo_url:       photo_url      || null,
      added_by:        user?.id       || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data }, { status: 201 })
}
