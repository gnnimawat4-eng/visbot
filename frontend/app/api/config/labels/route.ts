import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const { data } = await sb.from('company_config')
    .select('label_visitor,label_host,label_purpose,label_material,label_gate_pass,label_company,label_check_in,label_check_out,purposes,id_proof_types')
    .eq('company_id', CID!).single()
  return NextResponse.json({ labels: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const allowed = [
    'label_visitor','label_host','label_purpose','label_material',
    'label_gate_pass','label_company','label_check_in','label_check_out',
    'purposes','id_proof_types',
  ]
  const patch: Record<string, unknown> = { company_id: CID }
  for (const key of allowed) { if (body[key] !== undefined) patch[key] = body[key] }

  const { data, error } = await sb.from('company_config')
    .upsert(patch, { onConflict: 'company_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ labels: data })
}
