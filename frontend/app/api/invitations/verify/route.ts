import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const sb = createAdminClient()

  const { data, error } = await sb
    .from('invitations')
    .select('*, host:profiles(id, full_name, phone), company:companies(id, name, logo_url)')
    .eq('qr_token', token)
    .single()

  if (error || !data) return NextResponse.json({ valid: false, reason: 'not_found' })

  const today = new Date()
  const IST_OFFSET = 5.5 * 60 * 60 * 1000
  const nowIST = new Date(today.getTime() + IST_OFFSET)
  const todayStr = nowIST.toISOString().split('T')[0]

  if (data.status === 'used')      return NextResponse.json({ valid: false, reason: 'already_used',  invitation: data })
  if (data.status === 'cancelled') return NextResponse.json({ valid: false, reason: 'cancelled',     invitation: data })
  if (data.status === 'expired')   return NextResponse.json({ valid: false, reason: 'expired',       invitation: data })

  // Grace period: ±1 day
  const schedDate = new Date(data.scheduled_date)
  const diffDays = Math.abs((schedDate.getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 1) return NextResponse.json({ valid: false, reason: 'wrong_date', invitation: data })

  return NextResponse.json({ valid: true, invitation: data })
}
