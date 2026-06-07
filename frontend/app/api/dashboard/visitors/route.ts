import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest) {
  const CID = await resolveCompanyId()
  const { name, phone, purpose, host_name, photo_url } = await req.json()
  if (!name || !phone || !purpose || !host_name) {
    return NextResponse.json({ error: 'name, phone, purpose, host_name are required' }, { status: 400 })
  }
  const supabase = createAdminClient()

  // Upsert visitor — deduplicate by phone
  const { data: visitor, error: ve } = await supabase
    .from('visitors')
    .upsert({ name, phone, last_company_id: CID ?? null }, { onConflict: 'phone' })
    .select('id')
    .single()
  if (ve) return NextResponse.json({ error: ve.message }, { status: 500 })

  const { data: checkin, error: ce } = await supabase
    .from('checkins')
    .insert({
      visitor_id: visitor!.id,
      company_id: CID ?? '',
      purpose,
      host_name,
      photo_url:  photo_url || null,
      status:     'checked_in',
    })
    .select('*, visitor:visitors(name, phone, email)')
    .single()
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  return NextResponse.json({ checkin }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const CID = await resolveCompanyId()
  const { searchParams } = new URL(req.url)
  const search  = searchParams.get('q')       ?? ''
  const purpose = searchParams.get('purpose') ?? ''
  const status  = searchParams.get('status')  ?? ''
  const date    = searchParams.get('date')    ?? ''   // YYYY-MM-DD

  const supabase = createAdminClient()
  let q = supabase
    .from('checkins')
    .select('*, visitor:visitors(name, phone, email)')
    .order('created_at', { ascending: false })
    .limit(300)

  if (CID)     q = q.eq('company_id', CID)
  if (purpose) q = q.eq('purpose', purpose)
  if (status)  q = q.eq('status', status)
  if (date) {
    const end = new Date(date); end.setDate(end.getDate() + 1)
    q = q.gte('created_at', new Date(date).toISOString()).lt('created_at', end.toISOString())
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as Array<{
    visitor: { name: string; phone: string } | null
    [key: string]: unknown
  }>

  const filtered = search
    ? rows.filter(r => {
        const v = r.visitor
        return v?.name.toLowerCase().includes(search.toLowerCase()) ||
               v?.phone.includes(search)
      })
    : rows

  return NextResponse.json({ checkins: filtered })
}
