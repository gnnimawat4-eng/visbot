import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { member_ids } = await req.json()
  if (!member_ids?.length) return NextResponse.json({ error: 'member_ids required' }, { status: 400 })

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const now = new Date().toISOString()

  await sb.from('group_members')
    .update({ status: 'checked_out', checked_out_at: now })
    .in('id', member_ids)
    .eq('group_id', params.id)

  // Check if all members are out → update group status
  const { data: remaining } = await sb
    .from('group_members')
    .select('id')
    .eq('group_id', params.id)
    .eq('status', 'checked_in')

  let group = null
  if (!remaining?.length) {
    const { data } = await sb
      .from('visit_groups')
      .update({ status: 'checked_out', checked_out_at: now })
      .eq('id', params.id)
      .eq('company_id', CID!)
      .select()
      .single()
    group = data
  }

  return NextResponse.json({ success: true, all_exited: !remaining?.length, group })
}
