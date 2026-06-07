import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const CID    = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb = createAdminClient()

  const { data, error } = await sb
    .from('materials')
    .update({
      approval_status: 'approved',
      approved_by: user?.id ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('company_id', CID!)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}
