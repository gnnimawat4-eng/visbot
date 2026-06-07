import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { rejection_reason } = await req.json()
  if (!rejection_reason) return NextResponse.json({ error: 'rejection_reason required' }, { status: 400 })

  const CID    = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb = createAdminClient()

  const { data, error } = await sb
    .from('approval_requests')
    .update({
      status: 'rejected',
      rejected_by: user?.id ?? null,
      rejected_at: new Date().toISOString(),
      rejection_reason,
    })
    .eq('id', params.id)
    .eq('company_id', CID!)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approval: data })
}
