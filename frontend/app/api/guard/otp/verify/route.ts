import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json()
  if (!phone || !otp) return NextResponse.json({ error: 'phone and otp required' }, { status: 400 })

  const valid = await verifyOtp(phone, otp)
  if (!valid) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })

  return NextResponse.json({ verified: true })
}
