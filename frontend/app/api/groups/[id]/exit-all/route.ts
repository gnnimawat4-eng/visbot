import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const now = new Date().toISOString()

  await sb.from('group_members')
    .update({ status: 'checked_out', checked_out_at: now })
    .eq('group_id', params.id)
    .eq('status', 'checked_in')

  const { data, error } = await sb
    .from('visit_groups')
    .update({ status: 'checked_out', checked_out_at: now })
    .eq('id', params.id)
    .eq('company_id', CID!)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ group: data })
}
