import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient, createClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    pass_type, vehicle_number, vehicle_type, driver_name, driver_phone,
    party_name, party_phone, vendor_id, purpose, remarks, items = []
  } = body

  if (!vehicle_number || !party_name || !pass_type) {
    return NextResponse.json({ error: 'vehicle_number, party_name, pass_type required' }, { status: 400 })
  }

  const CID    = await resolveCompanyId()
  const sbUser = createClient()
  const { data: { user } } = await sbUser.auth.getUser()
  const sb = createAdminClient()

  // Generate pass number
  const year = new Date().getFullYear()
  const { count } = await sb.from('gate_passes').select('id', { count: 'exact', head: true }).eq('company_id', CID!)
  const passNumber = `GP-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Create gate pass
  const { data: pass, error: pErr } = await sb
    .from('gate_passes')
    .insert({
      company_id: CID,
      pass_number: passNumber,
      pass_type,
      vehicle_number,
      vehicle_type: vehicle_type || 'other',
      driver_name: driver_name || null,
      driver_phone: driver_phone || null,
      party_name,
      party_phone: party_phone || null,
      vendor_id: vendor_id || null,
      purpose: purpose || null,
      remarks: remarks || null,
      guard_id: user?.id ?? null,
      items: [],
    })
    .select()
    .single()

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  // Insert materials linked to this gate pass
  if (items.length > 0) {
    const materialRows = items.map((item: { item_name: string; category_id?: string; quantity?: number; value_inr?: number; entry_photo_url?: string }) => ({
      company_id: CID,
      gate_pass_id: pass.id,
      item_name: item.item_name,
      category_id: item.category_id || null,
      quantity: item.quantity || 1,
      value_inr: item.value_inr || null,
      direction: pass_type === 'inward' ? 'in' : 'out',
      entry_photo_url: item.entry_photo_url || null,
      approval_status: 'auto_approved',
    }))

    const { error: mErr } = await sb.from('materials').insert(materialRows)
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  }

  return NextResponse.json({ pass }, { status: 201 })
}
