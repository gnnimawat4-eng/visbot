import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST() {
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminClient()
  const { data, error } = await sb
    .from('host_preferences')
    .update({ out_of_office: false, ooo_until: null, ooo_backup_host_id: null, ooo_message: null, updated_at: new Date().toISOString() })
    .eq('profile_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ preferences: data })
}
