import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb  = createAdminClient()
  const CID = await resolveCompanyId()

  const { data, error } = await sb
    .from('invitations')
    .select('*, host:profiles(id, full_name, phone, email)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && data.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ invitation: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const sb   = createAdminClient()
  const CID  = await resolveCompanyId()

  const { data: existing } = await sb.from('invitations').select('company_id').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && existing.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await sb
    .from('invitations')
    .update(body)
    .eq('id', params.id)
    .select('*, host:profiles(id, full_name, phone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitation: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb   = createAdminClient()
  const CID  = await resolveCompanyId()

  const { data: existing } = await sb.from('invitations').select('company_id, status').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && existing.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await sb
    .from('invitations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
