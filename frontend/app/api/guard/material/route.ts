import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    item_name, quantity, direction, return_expected, checkin_id,
    category, vendor_name, value_inr, is_returnable,
    expected_return_date, return_status, entry_photo_url,
  } = body
  if (!item_name || !direction) {
    return NextResponse.json({ error: 'item_name and direction required' }, { status: 400 })
  }
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()
  const { data, error } = await sb
    .from('materials')
    .insert({
      company_id:           CID ?? '',
      item_name,
      quantity:             Number(quantity) || 1,
      direction,
      return_expected:      Boolean(return_expected),
      checkin_id:           checkin_id || null,
      category:             category || null,
      vendor_name:          vendor_name || null,
      value_inr:            value_inr ? Number(value_inr) : null,
      is_returnable:        Boolean(is_returnable),
      expected_return_date: expected_return_date || null,
      return_status:        return_status || null,
      entry_photo_url:      entry_photo_url || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data }, { status: 201 })
}
