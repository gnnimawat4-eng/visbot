import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('material_categories')
    .select('*')
    .eq('company_id', CID!)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, icon, color, requires_approval, requires_photo, requires_value, value_threshold_inr, allowed_directions, sort_order } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  const { data, error } = await sb
    .from('material_categories')
    .insert({
      company_id: CID,
      name,
      icon: icon || null,
      color: color || null,
      requires_approval: requires_approval ?? false,
      requires_photo: requires_photo ?? true,
      requires_value: requires_value ?? false,
      value_threshold_inr: value_threshold_inr || null,
      allowed_directions: allowed_directions ?? ['in', 'out'],
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data }, { status: 201 })
}
