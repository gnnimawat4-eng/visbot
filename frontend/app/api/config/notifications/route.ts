import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const { data } = await sb.from('company_config')
    .select('notify_host_on_arrival,notify_host_on_exit,notify_admin_on_blacklist,notify_admin_on_vip,notify_method')
    .eq('company_id', CID!).single()
  return NextResponse.json({ notifications: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const allowed = ['notify_host_on_arrival','notify_host_on_exit','notify_admin_on_blacklist','notify_admin_on_vip','notify_method']
  const patch: Record<string, unknown> = { company_id: CID }
  for (const key of allowed) { if (body[key] !== undefined) patch[key] = body[key] }

  const { data, error } = await sb.from('company_config')
    .upsert(patch, { onConflict: 'company_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data })
}
