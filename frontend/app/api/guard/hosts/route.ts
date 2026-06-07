import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const q   = new URL(req.url).searchParams.get('q') ?? ''
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let query = sb
    .from('hosts')
    .select('id, full_name, phone, department')
    .eq('active', true)
    .order('full_name')
    .limit(20)

  if (CID) query = query.eq('company_id', CID)
  if (q)   query = query.ilike('full_name', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hosts: data ?? [] })
}
