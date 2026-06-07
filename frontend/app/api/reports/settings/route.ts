import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data } = await sb
    .from('report_settings')
    .select('*')
    .eq('company_id', CID!)
    .single()

  return NextResponse.json({ settings: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const CID  = await resolveCompanyId()
  const sb   = createAdminClient()

  const { data, error } = await sb
    .from('report_settings')
    .upsert({
      company_id: CID,
      ...body,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
