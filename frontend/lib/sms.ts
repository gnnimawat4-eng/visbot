/**
 * SMS notification system — DEMO MODE
 *
 * In demo mode every "SMS" is:
 *   1. Logged to the sms_logs table (visible in Admin → SMS Log)
 *   2. console.log'd on the server
 *   3. Always returns { success: true, demo: true }
 *
 * To switch to real SMS later, replace the body of each function
 * with a Fast2SMS / Twilio call. The callers don't change at all.
 */
import { createClient } from '@supabase/supabase-js'

const CID = process.env.NEXT_PUBLIC_COMPANY_ID

// Service-role client — no cookies needed, pure server-side
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Mask all but last 4 digits: +91 9876543210 → +91 XXXXXX3210 */
export function maskPhone(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.length <= 4) return trimmed
  return trimmed.slice(0, -4).replace(/[0-9]/g, 'X') + trimmed.slice(-4)
}

export interface EntrySMSResult {
  success: boolean; demo: boolean; maskedPhone: string
}
export interface ExitSMSResult {
  success: boolean; demo: boolean; hostName: string
}

/**
 * Send entry notification to visitor.
 * Message: "Welcome to [Company]. Your visit at [time] has been registered."
 */
export async function sendEntrySMS(params: {
  checkin_id:    string
  visitor_name:  string
  visitor_phone: string
  company_name:  string
}): Promise<EntrySMSResult> {
  const time    = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const message = `Welcome to ${params.company_name}. Dear ${params.visitor_name}, your visit at ${time} has been registered. Please proceed to reception.`

  console.log('[SMS DEMO] Entry notification:', {
    to:      params.visitor_phone,
    visitor: params.visitor_name,
    company: params.company_name,
    message,
  })

  // Save to sms_logs (non-blocking — never throw)
  try {
    await db().from('sms_logs').insert({
      company_id:      CID ?? null,
      checkin_id:      params.checkin_id,
      type:            'entry',
      recipient_name:  params.visitor_name,
      recipient_phone: params.visitor_phone,
      message,
      status: 'demo',
    })
  } catch (err) {
    console.error('[SMS] Log failed:', err)
  }

  return { success: true, demo: true, maskedPhone: maskPhone(params.visitor_phone) }
}

/**
 * Send exit notification to host.
 * Message: "[Visitor] has checked out from [Company] at [time]."
 */
export async function sendExitSMS(params: {
  checkin_id:   string
  host_name:    string
  host_phone:   string
  visitor_name: string
  company_name: string
}): Promise<ExitSMSResult> {
  const time    = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const message = `${params.visitor_name} has checked out from ${params.company_name} at ${time}. — VisBot`

  console.log('[SMS DEMO] Exit notification:', {
    to:      params.host_phone,
    host:    params.host_name,
    visitor: params.visitor_name,
    message,
  })

  try {
    await db().from('sms_logs').insert({
      company_id:      CID ?? null,
      checkin_id:      params.checkin_id,
      type:            'exit',
      recipient_name:  params.host_name,
      recipient_phone: params.host_phone,
      message,
      status: 'demo',
    })
  } catch (err) {
    console.error('[SMS] Log failed:', err)
  }

  return { success: true, demo: true, hostName: params.host_name }
}
