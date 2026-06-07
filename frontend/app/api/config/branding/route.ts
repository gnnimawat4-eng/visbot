import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const { data } = await sb.from('company_config')
    .select('brand_color,logo_url,favicon_url,primary_font')
    .eq('company_id', CID!).single()
  return NextResponse.json({ branding: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { brand_color, logo_url, favicon_url, primary_font } = body
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb.from('company_config')
    .upsert({ company_id: CID, brand_color, logo_url, favicon_url, primary_font }, { onConflict: 'company_id' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ branding: data })
}
