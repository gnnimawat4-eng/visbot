import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { companyId: string } }) {
  const sb = createAdminClient()
  const { data } = await sb.from('company_config').select('*').eq('company_id', params.companyId).single()
  const json = JSON.stringify(data, null, 2)
  return new NextResponse(json, {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="config-${params.companyId}.json"` },
  })
}
