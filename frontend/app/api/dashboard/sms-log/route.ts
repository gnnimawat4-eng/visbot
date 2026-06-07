import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const sb   = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin  = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('company_id, role').eq('id', user.id).single()

  const { searchParams } = new URL(req.url)
  const type     = searchParams.get('type')     ?? ''
  const dateFrom = searchParams.get('date_from') ?? ''
  const dateTo   = searchParams.get('date_to')   ?? ''

  let query = admin
    .from('sms_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  // saas_owner sees all; admin sees only their company
  if (profile?.role !== 'saas_owner' && profile?.company_id) {
    query = query.eq('company_id', profile.company_id)
  }

  if (type)     query = query.eq('type', type as 'entry' | 'exit')
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}
