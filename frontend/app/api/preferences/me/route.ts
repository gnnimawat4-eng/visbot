import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminClient()
  const { data } = await sb
    .from('host_preferences')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  return NextResponse.json({ preferences: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('host_preferences')
    .upsert({
      profile_id: user.id,
      company_id: CID,
      ...body,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ preferences: data })
}
