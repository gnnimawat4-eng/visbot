import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyOtp } from '@/lib/otp'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { otp } = await req.json().catch(() => ({})) as { otp?: string }

  const sb = createAdminClient()

  // Fetch checkin to get visitor phone for OTP verification
  const { data: existing, error: fe } = await sb
    .from('checkins')
    .select('*, visitor:visitors(name,phone), company:companies(name)')
    .eq('id', params.id)
    .single()

  if (fe || !existing) return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })

  const visitorPhone = (existing.visitor as { phone: string } | null)?.phone

  if (!otp) return NextResponse.json({ error: 'OTP required' }, { status: 400 })
  if (!visitorPhone) return NextResponse.json({ error: 'Visitor phone not on record' }, { status: 400 })

  const valid = await verifyOtp(visitorPhone, otp)
  if (!valid) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })

  const { data: checkin, error } = await sb
    .from('checkins')
    .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*, visitor:visitors(name,phone), company:companies(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const host_phone = (checkin as Record<string, unknown>).host_phone as string | null
  const host_name  = (checkin as Record<string, unknown>).host_name  as string | null
  const visitor    = (checkin as Record<string, unknown>).visitor    as { name: string } | null
  const company    = (checkin as Record<string, unknown>).company    as { name: string } | null

  let sms = null
  if (host_phone) {
    const { sendExitSMS } = await import('@/lib/sms')
    sms = await sendExitSMS({
      checkin_id:   params.id,
      host_name:    host_name    ?? 'Host',
      host_phone,
      visitor_name: visitor?.name ?? 'Visitor',
      company_name: company?.name ?? 'VisBot',
    }).catch(() => ({ success: false, demo: true, hostName: host_name ?? 'Host' }))
  }

  return NextResponse.json({ checkin, sms })
}
