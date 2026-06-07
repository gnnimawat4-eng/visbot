import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getCallerProfile(): Promise<{ cid: string | null; role: string | null }> {
  const ENV_CID = process.env.NEXT_PUBLIC_COMPANY_ID ?? null
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cid: ENV_CID, role: null }
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('company_id, role').eq('id', user.id).single()
  return { cid: data?.company_id ?? ENV_CID, role: data?.role ?? null }
}

export async function GET() {
  const { cid, role } = await getCallerProfile()
  if (!cid && role !== 'saas_owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  let q = sb
    .from('profiles')
    .select('id,full_name,email,phone,role,active,created_at,company_id')
    .eq('role', 'guard')
    .order('created_at', { ascending: false })
  // saas_owner sees all guards across companies; admin sees only their own
  if (role !== 'saas_owner' && cid) q = q.eq('company_id', cid)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ guards: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { cid } = await getCallerProfile()
  if (!cid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, phone, email } = await req.json()
  if (!full_name || !email) {
    return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 })
  }

  const tempPassword = 'Visbot@' + Math.random().toString(36).slice(2, 8).toUpperCase()

  const sb = createAdminClient()

  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .insert({
      id:         authData.user.id,
      company_id: cid,
      full_name,
      email,
      phone:      phone ?? null,
      role:       'guard',
      active:     true,
    })
    .select()
    .single()

  if (profErr) {
    await sb.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profErr.message }, { status: 500 })
  }

  return NextResponse.json({ guard: profile, email, tempPassword }, { status: 201 })
}
