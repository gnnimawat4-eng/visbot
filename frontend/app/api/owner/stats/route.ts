import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const sb    = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [companies, users, checkins, gatePasses] = await Promise.all([
    sb.from('companies').select('*', { count: 'exact', head: true }).eq('active', true),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('active', true).neq('role', 'saas_owner'),
    sb.from('checkins').select('*', { count: 'exact', head: true }).gte('created_at', today),
    sb.from('gate_passes').select('*', { count: 'exact', head: true }).gte('created_at', today),
  ])

  const { data: recentCompanies } = await sb
    .from('companies')
    .select('id,name,slug,plan,active,created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return NextResponse.json({
    companies:      companies.count  ?? 0,
    users:          users.count      ?? 0,
    checkinsToday:  checkins.count   ?? 0,
    gatePassesToday: gatePasses.count ?? 0,
    recentCompanies: recentCompanies ?? [],
  })
}
