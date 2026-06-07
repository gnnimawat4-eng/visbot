import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { lifted_reason } = await req.json().catch(() => ({})) as { lifted_reason?: string }
  const sb   = createAdminClient()
  const CID  = await resolveCompanyId()

  const { data: existing } = await sb.from('blacklist').select('company_id').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && existing.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()

  const { data, error } = await sb
    .from('blacklist')
    .update({ status: 'lifted', lifted_by: user?.id ?? null, lifted_at: new Date().toISOString(), lifted_reason: lifted_reason ?? null })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
