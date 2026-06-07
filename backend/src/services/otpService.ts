import crypto from 'crypto'
import { redis } from '../config/redis'

const OTP_TTL = parseInt(process.env.OTP_EXPIRY_MINUTES || '5') * 60

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export async function storeOtp(phone: string, companyId: string, otp: string): Promise<void> {
  const key = `otp:${companyId}:${phone}`
  await redis.setex(key, OTP_TTL, otp)
}

export async function verifyOtp(phone: string, companyId: string, otp: string): Promise<boolean> {
  const key = `otp:${companyId}:${phone}`
  const stored = await redis.get(key)
  if (stored === otp) {
    await redis.del(key)   // single use
    return true
  }
  return false
}

export async function isReturningVisitor(phone: string, companyId: string, supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('visitors')
    .select('id')
    .eq('phone', phone)
    .eq('company_id', companyId)
    .single()
  return !!data
}
