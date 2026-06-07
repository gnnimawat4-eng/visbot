import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { full_name, phone, email, department, active } = await req.json()
  const sb = createAdminClient()
  type HostUpdate = { full_name?: string; phone?: string | null; email?: string | null; department?: string | null; active?: boolean }
  const update: HostUpdate = {}
  if (full_name  !== undefined) update.full_name  = full_name
  if (phone      !== undefined) update.phone      = phone || null
  if (email      !== undefined) update.email      = email || null
  if (department !== undefined) update.department = department || null
  if (active     !== undefined) update.active     = active
  const { data, error } = await sb.from('hosts').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createAdminClient()
  const { error } = await sb.from('hosts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
