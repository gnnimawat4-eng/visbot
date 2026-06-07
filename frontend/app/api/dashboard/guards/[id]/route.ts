import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('profiles')
    .update({ active: body.active })
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createAdminClient()
  await sb.from('profiles').delete().eq('id', params.id)
  await sb.auth.admin.deleteUser(params.id)
  return NextResponse.json({ ok: true })
}
