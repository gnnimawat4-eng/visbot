import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest) {
  const { ooo_until, ooo_backup_host_id, ooo_message } = await req.json()
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
      out_of_office: true,
      ooo_until: ooo_until || null,
      ooo_backup_host_id: ooo_backup_host_id || null,
      ooo_message: ooo_message || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ preferences: data })
}
