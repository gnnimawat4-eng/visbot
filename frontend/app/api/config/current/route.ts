import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  if (!CID) return NextResponse.json({ config: null })
  const sb = createAdminClient()

  const { data } = await sb
    .from('company_config')
    .select('*')
    .eq('company_id', CID)
    .single()

  return NextResponse.json({ config: data ?? null })
}
