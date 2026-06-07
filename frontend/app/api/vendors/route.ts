import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type')
  const status = searchParams.get('status') // active/inactive/blacklisted
  const city   = searchParams.get('city')
  const q      = searchParams.get('q')

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let query = sb
    .from('vendors')
    .select('*')
    .eq('company_id', CID!)
    .order('name', { ascending: true })

  if (type)   query = query.eq('vendor_type', type)
  if (city)   query = query.ilike('city', `%${city}%`)
  if (status === 'blacklisted') query = query.eq('is_blacklisted', true)
  else if (status === 'preferred') query = query.eq('is_preferred', true)
  else if (status === 'inactive') query = query.eq('is_active', false)
  else query = query.eq('is_active', true)
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,vendor_code.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendors: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    name, contact_person, phone, email, address, city, state, pincode,
    gst_number, vendor_type, services_provided, rating, notes,
    is_preferred, is_blacklisted, blacklist_reason
  } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const CID = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb = createAdminClient()

  const { data, error } = await sb
    .from('vendors')
    .insert({
      company_id: CID,
      name,
      contact_person: contact_person || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      gst_number: gst_number || null,
      vendor_type: vendor_type || 'other',
      services_provided: services_provided || null,
      rating: rating ?? 0,
      notes: notes || null,
      is_preferred: is_preferred ?? false,
      is_blacklisted: is_blacklisted ?? false,
      blacklist_reason: blacklist_reason || null,
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendor: data }, { status: 201 })
}
