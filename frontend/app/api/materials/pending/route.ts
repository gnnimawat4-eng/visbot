import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('materials')
    .select('*, category:material_categories(name, icon, color), vendor:vendors(name, phone)')
    .eq('company_id', CID!)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data ?? [] })
}
