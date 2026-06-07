import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { full_name, phone, role, company_id } = await req.json()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .upsert({ id: user.id, full_name, phone, role: role ?? 'admin', company_id: company_id ?? null, active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
