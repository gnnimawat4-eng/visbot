import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/otp'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone?.trim()) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  const otp = await sendOtp(phone.trim())
  // Demo mode: log and return OTP so guard can show it to visitor
  console.log(`[OTP DEMO] ${phone} → ${otp}`)

  return NextResponse.json({ otpSent: true, otp })
}
