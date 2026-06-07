// Redis is optional — if REDIS_URL is not set, OTPs are stored in-memory (demo mode).
// This prevents the server from hanging on Vercel when no Redis is configured.

import type { Redis as RedisType } from 'ioredis'

// ── In-memory fallback store ──────────────────────────────────────────────────
const memStore = new Map<string, { otp: string; expiresAt: number }>()

// ── Lazy Redis client (only created when REDIS_URL is set) ────────────────────
let _redis: RedisType | null = null

function getRedis(): RedisType | null {
  if (!process.env.REDIS_URL) return null
  if (!_redis) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis') as typeof import('ioredis').default
    _redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,     // fail fast instead of queueing forever
      enableOfflineQueue:   false, // reject commands immediately when disconnected
    })
    _redis!.on('error', err => console.error('[Redis OTP]', err.message))
  }
  return _redis
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOtp(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate and store an OTP for a phone number.
 * Returns the OTP string so callers can show it in demo mode.
 */
export async function sendOtp(phone: string, company?: string): Promise<string> {
  const otp = generateOtp(Number(process.env.OTP_LENGTH) || 6)
  const ttl = Number(process.env.OTP_EXPIRY_SECONDS) || 300
  const key = `otp:${phone}`

  const r = getRedis()
  if (r) {
    await r.setex(key, ttl, otp)
  } else {
    memStore.set(key, { otp, expiresAt: Date.now() + ttl * 1000 })
    console.log(`[OTP DEMO] ${phone} → ${otp}`)
  }

  if (process.env.SMS_PROVIDER === 'fast2sms') {
    const msg = company
      ? `Welcome to ${company}. Your OTP: ${otp}. Valid for ${Math.round(ttl / 60)} mins.`
      : `Your VisBot OTP is ${otp}. Valid for ${Math.round(ttl / 60)} mins.`
    await sendSms(phone, msg, otp)
  }

  return otp
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const key = `otp:${phone}`

  const r = getRedis()
  if (r) {
    const stored = await r.get(key)
    if (stored !== otp) return false
    await r.del(key)
    return true
  }

  // Demo / in-memory mode
  const entry = memStore.get(key)
  if (!entry) return false
  if (entry.expiresAt < Date.now()) { memStore.delete(key); return false }
  if (entry.otp !== otp) return false
  memStore.delete(key)
  return true
}

/**
 * Send checkout notification to HOST phone on VISITOR EXIT.
 */
export async function sendCheckoutSms(hostPhone: string, visitorName: string, company?: string): Promise<void> {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const msg  = `${visitorName} has checked out from ${company ?? 'VisBot'} at ${time}.`
  await sendSms(hostPhone, msg)
}

/**
 * Low-level SMS sender (Fast2SMS). No-op when SMS_PROVIDER is not configured.
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
