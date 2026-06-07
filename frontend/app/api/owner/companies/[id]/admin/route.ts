import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { full_name, email, phone } = await req.json()

  if (!full_name || !email) {
    return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Verify the company exists
  const { data: company } = await sb.from('companies').select('id,name').eq('id', params.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  // Check there isn't already an admin for this company
  const { count } = await sb
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', params.id)
    .eq('role', 'admin')
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'This company already has an admin. Remove the existing admin first.' }, { status: 409 })
  }

  // Generate temp password
  const tempPassword = 'Admin@' + Math.random().toString(36).slice(2, 8).toUpperCase()

  // Create Supabase auth user
  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  // Create profile with role=admin and company_id
  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .insert({
      id:         authData.user.id,
      company_id: params.id,
      full_name,
      email,
      phone:      phone ?? null,
      role:       'admin',
      active:     true,
    })
    .select()
    .single()

  if (profErr) {
    await sb.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profErr.message }, { status: 500 })
  }

  return NextResponse.json({ admin: profile, email, tempPassword, companyName: company.name }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { adminId } = await req.json()
  if (!adminId) return NextResponse.json({ error: 'adminId required' }, { status: 400 })

  const sb = createAdminClient()

  // Verify the profile belongs to this company and is an admin
  const { data: profile } = await sb
    .from('profiles')
    .select('id')
    .eq('id', adminId)
    .eq('company_id', params.id)
    .eq('role', 'admin')
    .single()

  if (!profile) return NextResponse.json({ error: 'Admin not found for this company' }, { status: 404 })

  await sb.from('profiles').delete().eq('id', adminId)
  await sb.auth.admin.deleteUser(adminId)

  return NextResponse.json({ ok: true })
}
