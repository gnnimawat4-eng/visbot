import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { template_name } = await req.json()
  if (!template_name) return NextResponse.json({ error: 'template_name required' }, { status: 400 })

  const sb = createAdminClient()

  // Get template config
  const { data: tmpl, error: tErr } = await sb
    .from('industry_templates')
    .select('config')
    .eq('name', template_name)
    .single()

  if (tErr || !tmpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // Merge template config with base defaults + set industry_template name
  const patch = { ...tmpl.config, company_id: params.companyId, industry_template: template_name }

  const { data, error } = await sb
    .from('company_config')
    .upsert(patch, { onConflict: 'company_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
