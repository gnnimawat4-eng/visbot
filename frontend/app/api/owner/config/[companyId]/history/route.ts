import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { companyId: string } }) {
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('config_history')
    .select('*, changer:profiles!config_history_changed_by_fkey(full_name, email)')
    .eq('company_id', params.companyId)
    .order('changed_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ history: data ?? [] })
}
