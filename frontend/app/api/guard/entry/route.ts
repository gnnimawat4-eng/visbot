import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { verifyOtp } from '@/lib/otp'

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('[guard/entry] request body:', JSON.stringify(body))

  const { name, phone, purpose, host_name, host_phone, photo_url, company, otp } = body

  if (!name || !phone || !purpose || !host_name) {
    return NextResponse.json({ error: 'name, phone, purpose, host_name required' }, { status: 400 })
  }
  if (!otp) {
    return NextResponse.json({ error: 'OTP required' }, { status: 400 })
  }

  // Verify OTP before creating checkin
  const valid = await verifyOtp(phone, otp)
  if (!valid) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })

  // Resolve company_id: prefer guard's session profile, fall back to env var
  let company_id: string | null = process.env.NEXT_PUBLIC_COMPANY_ID ?? null

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[guard/entry] auth user:', user?.id)

    if (user) {
      const admin = createAdminClient()
      const { data: profile, error: profileErr } = await admin
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      console.log('[guard/entry] profile:', profile, profileErr?.message)
      if (profile?.company_id) company_id = profile.company_id
    }
  } catch (err) {
    console.warn('[guard/entry] could not resolve company_id from session:', err)
  }

  console.log('[guard/entry] resolved company_id:', company_id)

  if (!company_id) {
    return NextResponse.json({ error: 'Company not configured — set NEXT_PUBLIC_COMPANY_ID or ensure guard has a company_id in their profile' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Upsert visitor
  const { data: visitor, error: visitorErr } = await sb
    .from('visitors')
    .upsert({ name, phone, last_company_id: company_id }, { onConflict: 'phone' })
    .select('id')
    .single()

  console.log('[guard/entry] visitor upsert result:', visitor, visitorErr?.message)

  if (visitorErr || !visitor) {
    return NextResponse.json({ error: visitorErr?.message ?? 'Failed to upsert visitor' }, { status: 500 })
  }

  // Insert checkin
  const { data: checkin, error: checkinErr } = await sb
    .from('checkins')
    .insert({
      visitor_id: visitor.id,
      company_id,
      purpose,
      host_name,
      host_phone: host_phone ?? null,
      photo_url:  photo_url ?? null,
      status:     'checked_in',
    })
    .select('*, visitor:visitors(name,phone)')
    .single()

  console.log('[guard/entry] checkin insert result:', checkin, checkinErr?.message)

  if (checkinErr || !checkin) {
    return NextResponse.json({ error: checkinErr?.message ?? 'Failed to create checkin' }, { status: 500 })
  }

  // Demo SMS entry notification (non-blocking)
  const { sendEntrySMS } = await import('@/lib/sms')
  const sms = await sendEntrySMS({
    checkin_id:    checkin.id,
    visitor_name:  name,
    visitor_phone: phone,
    company_name:  company ?? 'VisBot',
  }).catch(() => ({ success: false, demo: true, maskedPhone: '' }))

  return NextResponse.json({ checkin, sms }, { status: 201 })
}
