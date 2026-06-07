import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('industry_templates')
    .select('*')
    .order('is_default', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, display_name, description, icon, config } = body
  if (!name || !display_name || !config) return NextResponse.json({ error: 'name, display_name, config required' }, { status: 400 })
  const sb = createAdminClient()
  const { data, error } = await sb.from('industry_templates').insert({ name, display_name, description, icon, config }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
