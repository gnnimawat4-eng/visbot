import { Request, Response } from 'express'
import { supabase }             from '../config/supabase'
import { generateOtp, storeOtp, verifyOtp, isReturningVisitor } from '../services/otpService'
import { sendOtpSms }           from '../services/smsService'
import { uploadVisitorPhoto }   from '../services/photoService'
import { io }                   from '../index'

// POST /api/checkin/check-phone
// Kiosk: check if phone is a returning visitor
export async function checkPhoneForReturning(req: Request, res: Response) {
  const { phone, companyId } = req.body
  if (!phone || !companyId) return res.status(400).json({ error: 'phone and companyId required' })

  const returning = await isReturningVisitor(phone, companyId, supabase)
  res.json({ returning })
}

// POST /api/checkin/send-otp
export async function sendOtp(req: Request, res: Response) {
  try {
    const { phone, companyId } = req.body
    const otp = generateOtp()
    await storeOtp(phone, companyId, otp)
    await sendOtpSms(phone, otp)
    res.json({ success: true, message: `OTP sent to ${phone.slice(0, 4)}****${phone.slice(-3)}` })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/checkin/verify-otp  (returning visitor full flow)
export async function verifyOtpAndCheckin(req: Request, res: Response) {
  const { phone, companyId, otp, hostName, purpose } = req.body
  const valid = await verifyOtp(phone, companyId, otp)
  if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' })

  const { data: visitor } = await supabase
    .from('visitors').select('*').eq('phone', phone).eq('company_id', companyId).single()

  const { data: checkin, error } = await supabase.from('checkins').insert({
    company_id: companyId, visitor_id: visitor.id,
    host_name: hostName, purpose, status: 'checked_in',
    checked_in_at: new Date().toISOString(), otp_used: true,
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })

  // Emit to gate display
  io.to(`company:${companyId}`).emit('visitor:checkin', { checkin, visitor })
  res.json({ success: true, checkin, visitor })
}

// POST /api/checkin/new  (new visitor)
export async function newVisitorCheckin(req: Request, res: Response) {
  const { companyId, name, phone, hostName, purpose, photoBase64, idType, idNumber } = req.body

  let photoUrl: string | null = null

  // 1. Create/upsert visitor
  let { data: visitor } = await supabase
    .from('visitors').upsert({ company_id: companyId, name, phone, id_type: idType, id_number: idNumber },
      { onConflict: 'phone,company_id' }).select().single()

  // 2. Upload photo if provided
  if (photoBase64 && visitor) {
    photoUrl = await uploadVisitorPhoto(photoBase64, visitor.id)
    await supabase.from('visitors').update({ photo_url: photoUrl }).eq('id', visitor.id)
  }

  // 3. Create checkin
  const { data: checkin, error } = await supabase.from('checkins').insert({
    company_id: companyId, visitor_id: visitor!.id,
    host_name: hostName, purpose, status: 'checked_in',
    checked_in_at: new Date().toISOString(), otp_used: false,
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })

  io.to(`company:${companyId}`).emit('visitor:checkin', { checkin, visitor })
  res.json({ success: true, checkin, visitor })
}

// POST /api/checkin/checkout/:id
export async function checkoutVisitor(req: Request, res: Response) {
  const { id } = req.params
  const { data, error } = await supabase.from('checkins')
    .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true, checkin: data })
}

// GET /api/checkin/today
export async function getTodayCheckins(req: Request, res: Response) {
  const companyId = (req as any).user.companyId
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const { data, error } = await supabase.from('checkins')
    .select('*, visitors(*)')
    .eq('company_id', companyId)
    .gte('checked_in_at', today.toISOString())
    .order('checked_in_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
