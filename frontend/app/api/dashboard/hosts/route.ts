import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getCompanyId(): Promise<string | null> {
  const ENV_CID = process.env.NEXT_PUBLIC_COMPANY_ID ?? null
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return ENV_CID
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('company_id').eq('id', user.id).single()
  return data?.company_id ?? ENV_CID
}

export async function GET() {
  const cid = await getCompanyId()
  if (!cid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('hosts')
    .select('*')
    .eq('company_id', cid)
    .order('full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hosts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const cid = await getCompanyId()
  if (!cid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { full_name, phone, email, department } = await req.json()
  if (!full_name?.trim()) return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('hosts')
    .insert({ company_id: cid, full_name: full_name.trim(), phone: phone || null, email: email || null, department: department || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
