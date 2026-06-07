import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('material_categories')
    .update(body)
    .eq('id', params.id)
    .eq('company_id', CID!)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { error } = await sb
    .from('material_categories')
    .update({ is_active: false })
    .eq('id', params.id)
    .eq('company_id', CID!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
