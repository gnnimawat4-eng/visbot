import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const q   = new URL(req.url).searchParams.get('q') ?? ''
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let query = sb
    .from('checkins')
    .select('*, visitor:visitors(name,phone)')
    .eq('status', 'checked_in')
    .order('created_at', { ascending: false })

  if (CID) query = query.eq('company_id', CID)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as Array<{ visitor: { name: string; phone: string } | null; [k: string]: unknown }>
  const filtered = q
    ? rows.filter(r => r.visitor?.name.toLowerCase().includes(q.toLowerCase()) || r.visitor?.phone.includes(q))
    : rows

  return NextResponse.json({ checkins: filtered })
}
