import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

type Ctx = { params: { companyId: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const sb = createAdminClient()
  const [cfgRes, compRes] = await Promise.all([
    sb.from('company_config').select('*').eq('company_id', params.companyId).single(),
    sb.from('companies').select('id,name,slug,plan,active,logo_url,created_at').eq('id', params.companyId).single(),
  ])
  return NextResponse.json({ config: cfgRes.data ?? null, company: compRes.data ?? null })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json()
  const sb   = createAdminClient()

  // Strip non-config keys
  const { id: _id, created_at: _c, ...patch } = body
  patch.company_id = params.companyId

  const { data, error } = await sb
    .from('company_config')
    .upsert(patch, { onConflict: 'company_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
