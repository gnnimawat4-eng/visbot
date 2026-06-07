import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const sb = createAdminClient()
  const { data, error } = await sb.from('industry_templates').select('*').eq('name', params.name).single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ template: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { name: string } }) {
  const body = await req.json()
  const sb = createAdminClient()
  const { data, error } = await sb.from('industry_templates').update(body).eq('name', params.name).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
