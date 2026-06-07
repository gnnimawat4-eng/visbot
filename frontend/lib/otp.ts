import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

function generateOtp(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

/**
 * Send OTP to visitor's phone on ENTRY.
 * Message: "Welcome to [Company]. Your OTP: XXXXXX"
 */
export async function sendOtp(phone: string, company?: string): Promise<string> {
  const otp = generateOtp(Number(process.env.OTP_LENGTH) || 6)
  const ttl = Number(process.env.OTP_EXPIRY_SECONDS) || 300
  await redis.setex(`otp:${phone}`, ttl, otp)

  if (process.env.SMS_PROVIDER === 'fast2sms') {
    const msg = company
      ? `Welcome to ${company}. Your OTP: ${otp}. Valid for ${ttl / 60} mins.`
      : `Your VisBot OTP is ${otp}. Valid for ${ttl / 60} mins.`
    await sendSms(phone, msg, otp)
  }
  return otp
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const stored = await redis.get(`otp:${phone}`)
  if (stored !== otp) return false
  await redis.del(`otp:${phone}`)
  return true
}

/**
 * Send checkout notification to HOST phone on VISITOR EXIT.
 * Message: "[VisitorName] has checked out at [Time]"
 */
export async function sendCheckoutSms(hostPhone: string, visitorName: string, company?: string): Promise<void> {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const msg  = `${visitorName} has checked out from ${company ?? 'VisBot'} at ${time}.`
  await sendSms(hostPhone, msg)
}

/**
 * Send a plain SMS (DLT route). Used for host checkout notification.
 */
export async function sendSms(phone: string, message: string, otpValue?: string): Promise<void> {
  if (process.env.SMS_PROVIDER !== 'fast2sms') return
  try {
    const body: Record<string, unknown> = otpValue
      ? { route: 'otp', variables_values: otpValue, numbers: phone }
      : { route: 'dlt', message, numbers: phone, flash: 0 }

    await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method:  'POST',
      headers: { authorization: process.env.FAST2SMS_API_KEY!, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch (err) {
    console.error('SMS send failed:', err)
  }
}
