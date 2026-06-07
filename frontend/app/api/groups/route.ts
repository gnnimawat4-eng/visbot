import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date   = searchParams.get('date')

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let query = sb
    .from('visit_groups')
    .select('*, members:group_members(*), lead:visitors!visit_groups_lead_visitor_id_fkey(name, phone)')
    .eq('company_id', CID!)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (date)   query = query.gte('created_at', date).lt('created_at', new Date(new Date(date).getTime() + 86400000).toISOString())

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ groups: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { lead_name, lead_phone, group_size, purpose, host_id, host_name, host_phone, members, notes, exit_mode } = body

  if (!lead_name || !lead_phone || !group_size || !purpose) {
    return NextResponse.json({ error: 'lead_name, lead_phone, group_size, purpose required' }, { status: 400 })
  }

  const CID    = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb = createAdminClient()

  // Upsert visitor for lead
  let leadVisitorId: string
  const { data: existingVisitor } = await sb.from('visitors').select('id').eq('phone', lead_phone).single()
  if (existingVisitor) {
    leadVisitorId = existingVisitor.id
  } else {
    const { data: newVisitor, error: vErr } = await sb
      .from('visitors')
      .insert({ name: lead_name, phone: lead_phone, last_company_id: CID })
      .select('id')
      .single()
    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })
    leadVisitorId = newVisitor!.id
  }

  // Create group
  const { data: group, error: gErr } = await sb
    .from('visit_groups')
    .insert({
      company_id: CID,
      lead_visitor_id: leadVisitorId,
      lead_name,
      lead_phone,
      group_size,
      purpose,
      host_id: host_id || null,
      host_name: host_name || null,
      host_phone: host_phone || null,
      notes: notes || null,
      exit_mode: exit_mode || 'together',
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 })

  // Insert members
  const memberRows = (members as Array<{ name: string; phone?: string; id_proof_type?: string; id_proof_number?: string }>).map((m, i) => ({
    group_id: group.id,
    company_id: CID,
    member_name: m.name,
    member_phone: m.phone || null,
    id_proof_type: m.id_proof_type || null,
    id_proof_number: m.id_proof_number || null,
    is_lead: i === 0,
  }))

  const { error: mErr } = await sb.from('group_members').insert(memberRows)
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  return NextResponse.json({ group }, { status: 201 })
}
