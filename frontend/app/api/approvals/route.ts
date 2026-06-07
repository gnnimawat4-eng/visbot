import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type   = searchParams.get('type')

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let query = sb
    .from('approval_requests')
    .select('*, requester:profiles!approval_requests_requested_by_fkey(full_name), approver:profiles!approval_requests_approved_by_fkey(full_name)')
    .eq('company_id', CID!)
    .order('requested_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (type)   query = query.eq('request_type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approvals: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    request_type, visitor_name, visitor_phone, visitor_photo_url, visitor_purpose,
    visitor_host_id, visitor_company, visitor_vip_reason, visitor_id,
    material_id, material_description, material_value, material_photo_url, notes
  } = body

  if (!request_type) return NextResponse.json({ error: 'request_type required' }, { status: 400 })

  const CID    = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb = createAdminClient()

  const { data, error } = await sb
    .from('approval_requests')
    .insert({
      company_id: CID,
      request_type,
      visitor_id: visitor_id || null,
      visitor_name: visitor_name || null,
      visitor_phone: visitor_phone || null,
      visitor_photo_url: visitor_photo_url || null,
      visitor_purpose: visitor_purpose || null,
      visitor_host_id: visitor_host_id || null,
      visitor_company: visitor_company || null,
      visitor_vip_reason: visitor_vip_reason || null,
      material_id: material_id || null,
      material_description: material_description || null,
      material_value: material_value || null,
      material_photo_url: material_photo_url || null,
      notes: notes || null,
      requested_by: user!.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approval: data }, { status: 201 })
}
