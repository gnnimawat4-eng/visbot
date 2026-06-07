import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const [vendorRes, materialsRes, passesRes] = await Promise.all([
    sb.from('vendors').select('*').eq('id', params.id).eq('company_id', CID!).single(),
    sb.from('materials').select('*').eq('vendor_id', params.id).order('created_at', { ascending: false }).limit(50),
    sb.from('gate_passes').select('*').eq('vendor_id', params.id).order('created_at', { ascending: false }).limit(50),
  ])

  if (vendorRes.error) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  return NextResponse.json({
    vendor: vendorRes.data,
    materials: materialsRes.data ?? [],
    gate_passes: passesRes.data ?? [],
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('vendors')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('company_id', CID!)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendor: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { error } = await sb
    .from('vendors')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('company_id', CID!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
