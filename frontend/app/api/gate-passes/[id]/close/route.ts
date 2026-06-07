import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await sb
    .from('gate_passes')
    .update({ status: 'exited', checked_out_at: now })
    .eq('id', params.id)
    .eq('company_id', CID!)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pass: data })
}
