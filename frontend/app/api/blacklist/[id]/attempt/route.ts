import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({})) as { attempted_phone?: string; attempted_name?: string; notes?: string }

  const sb   = createAdminClient()
  const CID  = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()

  const { data, error } = await sb
    .from('blacklist_attempts')
    .insert({
      blacklist_id:    params.id,
      company_id:      CID,
      guard_id:        user?.id ?? null,
      attempted_phone: body.attempted_phone ?? null,
      attempted_name:  body.attempted_name  ?? null,
      notes:           body.notes           ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attempt: data }, { status: 201 })
}
