import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type      = searchParams.get('type')
  const status    = searchParams.get('status')
  const dateFrom  = searchParams.get('date_from')
  const dateTo    = searchParams.get('date_to')
  const vehicle   = searchParams.get('vehicle')
  const party     = searchParams.get('party')

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let q = sb
    .from('gate_passes')
    .select('*, guard:profiles(full_name)')
    .order('created_at', { ascending: false })

  if (CID)      q = q.eq('company_id', CID)
  if (type)     q = q.eq('pass_type',  type   as 'inward' | 'outward')
  if (status)   q = q.eq('status',     status as 'inside' | 'exited' | 'cancelled')
  if (dateFrom) q = q.gte('created_at', dateFrom)
  if (dateTo)   q = q.lte('created_at', dateTo + 'T23:59:59')
  if (vehicle)  q = q.ilike('vehicle_number', `%${vehicle}%`)
  if (party)    q = q.ilike('party_name', `%${party}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ gate_passes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    pass_type, vehicle_number, vehicle_type,
    driver_name, driver_phone, driver_license,
    party_name, party_phone, party_address,
    items, total_weight, weight_unit,
    purpose, po_number, invoice_number,
    vehicle_photo_url, document_photo_url, remarks,
  } = body

  if (!pass_type || !vehicle_number || !party_name) {
    return NextResponse.json({ error: 'pass_type, vehicle_number, party_name required' }, { status: 400 })
  }

  const CID = await resolveCompanyId()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sb = createAdminClient()
  const { data, error } = await sb
    .from('gate_passes')
    .insert({
      company_id: CID ?? null,
      pass_type,
      vehicle_number: vehicle_number.toUpperCase(),
      vehicle_type:   vehicle_type ?? null,
      driver_name:    driver_name   ?? null,
      driver_phone:   driver_phone  ?? null,
      driver_license: driver_license ?? null,
      party_name,
      party_phone:    party_phone   ?? null,
      party_address:  party_address ?? null,
      items:          items ?? [],
      total_weight:   total_weight  ?? null,
      weight_unit:    weight_unit   ?? 'kg',
      purpose:        purpose       ?? null,
      po_number:      po_number     ?? null,
      invoice_number: invoice_number ?? null,
      guard_id:       user?.id      ?? null,
      vehicle_photo_url:  vehicle_photo_url  ?? null,
      document_photo_url: document_photo_url ?? null,
      remarks:        remarks       ?? null,
      status: 'inside',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ gate_pass: data }, { status: 201 })
}
