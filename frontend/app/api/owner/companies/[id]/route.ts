import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb    = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [company, users, checkinsToday, totalCheckins, gatePassesToday, materialsOut] = await Promise.all([
    sb.from('companies').select('*').eq('id', params.id).single(),
    sb.from('profiles').select('id,full_name,email,phone,role,active,created_at').eq('company_id', params.id).order('role').order('created_at'),
    sb.from('checkins').select('*', { count: 'exact', head: true }).eq('company_id', params.id).gte('created_at', today),
    sb.from('checkins').select('*', { count: 'exact', head: true }).eq('company_id', params.id),
    sb.from('gate_passes').select('*', { count: 'exact', head: true }).eq('company_id', params.id).gte('created_at', today),
    sb.from('materials').select('*', { count: 'exact', head: true }).eq('company_id', params.id).eq('direction', 'out').is('returned_at', null),
  ])

  const { data: recentCheckins } = await sb
    .from('checkins')
    .select('*, visitor:visitors(name,phone)')
    .eq('company_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentPasses } = await sb
    .from('gate_passes')
    .select('id,pass_number,pass_type,vehicle_number,party_name,status,checked_in_at')
    .eq('company_id', params.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    company:         company.data,
    users:           users.data ?? [],
    checkinsToday:   checkinsToday.count   ?? 0,
    totalCheckins:   totalCheckins.count   ?? 0,
    gatePassesToday: gatePassesToday.count ?? 0,
    materialsOut:    materialsOut.count    ?? 0,
    recentCheckins:  recentCheckins        ?? [],
    recentPasses:    recentPasses          ?? [],
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const sb   = createAdminClient()
  // Only allow specific fields to be updated
  const update: { active?: boolean; plan?: string; name?: string; logo_url?: string } = {}
  if (typeof body.active   === 'boolean') update.active   = body.active
  if (typeof body.plan     === 'string')  update.plan     = body.plan
  if (typeof body.name     === 'string')  update.name     = body.name
  if (typeof body.logo_url === 'string')  update.logo_url = body.logo_url
  const { data, error } = await sb.from('companies').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
