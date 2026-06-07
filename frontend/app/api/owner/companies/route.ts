import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAdminClientRaw } from '@/lib/supabase/server'

export async function GET() {
  const sb    = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // All companies
  const { data: companies, error } = await sb
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!companies?.length) return NextResponse.json({ companies: [] })

  const ids = companies.map(c => c.id)

  const sbRaw = createAdminClientRaw()

  // All profiles, today's checkins, and company configs in parallel
  const [profilesRes, checkinsRes, configsRes] = await Promise.all([
    sb.from('profiles').select('id, full_name, email, role, company_id, active').in('company_id', ids),
    sb.from('checkins').select('company_id').in('company_id', ids).gte('created_at', today),
    sbRaw.from('company_config').select('company_id, industry_template').in('company_id', ids),
  ])

  const profileMap  = profilesRes.data ?? []
  const checkinList = checkinsRes.data ?? []
  const configMap   = (configsRes.data ?? []) as { company_id: string; industry_template: string }[]

  const enriched = companies.map(c => {
    const cp       = profileMap.filter(p => p.company_id === c.id)
    const admin    = cp.find(p => p.role === 'admin')
    const guards   = cp.filter(p => p.role === 'guard' && p.active).length
    const todayCi  = checkinList.filter(ci => ci.company_id === c.id).length
    const cfg      = configMap.find(x => x.company_id === c.id)
    return {
      ...c,
      admin_name:        admin?.full_name ?? null,
      admin_email:       admin?.email     ?? null,
      guards_count:      guards,
      checkins_today:    todayCi,
      industry_template: cfg?.industry_template ?? null,
    }
  })

  return NextResponse.json({ companies: enriched })
}

export async function POST(req: NextRequest) {
  const { name, slug, plan } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('companies')
    .insert({ name, slug, plan: plan ?? 'starter' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
