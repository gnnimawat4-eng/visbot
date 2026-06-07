import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { z } from 'zod'

const schema = z.object({ phone: z.string(), otp: z.string().length(6) })

export async function POST(req: NextRequest) {
  const { phone, otp } = schema.parse(await req.json())
  const valid = await verifyOtp(phone, otp)
  if (!valid) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
  return NextResponse.json({ verified: true })
}
