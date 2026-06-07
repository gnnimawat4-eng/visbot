import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ vendors: [] })

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('vendors')
    .select('id, vendor_code, name, phone, email, contact_person, city, vendor_type, is_preferred, is_blacklisted, gst_number')
    .eq('company_id', CID!)
    .eq('is_active', true)
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%,vendor_code.ilike.%${q}%`)
    .order('is_preferred', { ascending: false })
    .order('name', { ascending: true })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendors: data ?? [] })
}
