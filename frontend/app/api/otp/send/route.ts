import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOtp } from '@/lib/otp'
import { z } from 'zod'

const schema = z.object({ phone: z.string().min(10) })

export async function POST(req: NextRequest) {
  const { phone } = schema.parse(await req.json())
  const supabase = createClient()

  const { data: visitor } = await supabase
    .from('visitors')
    .select('id, name, last_company_id')
    .eq('phone', phone)
    .single()

  const otp = await sendOtp(phone)
  return NextResponse.json({ returning: !!visitor, visitor: visitor ?? null, otpSent: !!otp })
}
