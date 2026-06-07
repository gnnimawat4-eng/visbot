import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const qId      = req.nextUrl.searchParams.get('id')
  const CID      = qId ?? (await resolveCompanyId())
  const supabase = createAdminClient()
  let q = supabase.from('companies').select('*')
  if (CID) q = q.eq('id', CID)
  const { data, error } = await q.limit(1).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body     = await req.json()
  const supabase = createAdminClient()

  // Allow updating all branding fields
  const allowed = [
    'name', 'logo_url',
    'legal_name', 'address_line1', 'address_line2', 'city', 'state', 'pincode',
    'gst_number', 'cin_number', 'phone', 'email', 'website',
    'authorized_signatory_name', 'authorized_signatory_designation',
    'signature_url', 'stamp_url', 'footer_text',
  ] as const

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key] || null
  }

  const { data, error } = await supabase
    .from('companies')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(update as any)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body     = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('companies')
    .insert({ name: body.name, slug: body.slug })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
