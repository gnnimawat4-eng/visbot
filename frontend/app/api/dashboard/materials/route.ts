import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest) {
  const CID = await resolveCompanyId()
  const { item_name, quantity, direction, return_expected, checkin_id, photo_url } = await req.json()
  if (!item_name || !direction) {
    return NextResponse.json({ error: 'item_name and direction are required' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('materials')
    .insert({
      company_id:      CID ?? '',
      item_name,
      quantity:        Number(quantity) || 1,
      direction,
      return_expected: Boolean(return_expected),
      checkin_id:      checkin_id || null,
      photo_url:       photo_url   || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const CID = await resolveCompanyId()
  const { searchParams } = new URL(req.url)
  const direction  = searchParams.get('direction')   ?? ''
  const pendingOnly = searchParams.get('pending') === 'true'

  const supabase = createAdminClient()
  let q = supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (CID)        q = q.eq('company_id', CID)
  if (direction)  q = q.eq('direction', direction)
  if (pendingOnly) q = q.eq('direction', 'out').is('returned_at', null).eq('return_expected', true)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data ?? [] })
}
