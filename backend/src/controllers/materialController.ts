import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { AuthRequest } from '../middleware/auth'

export async function logMaterial(req: AuthRequest, res: Response) {
  const { checkinId, name, quantity, unit, direction, returnExpected, notes } = req.body
  const { data, error } = await supabase.from('materials').insert({
    company_id: req.user!.companyId, checkin_id: checkinId,
    name, quantity, unit, direction,
    return_expected: returnExpected ?? direction === 'out',
    notes,
  }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getMaterials(req: AuthRequest, res: Response) {
  const { pending } = req.query
  let query = supabase.from('materials')
    .select('*, checkins(*, visitors(name,phone))')
    .eq('company_id', req.user!.companyId)
    .order('created_at', { ascending: false })

  if (pending === 'true') {
    query = query.eq('return_expected', true).is('returned_at', null)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function markReturned(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { data, error } = await supabase.from('materials')
    .update({ returned_at: new Date().toISOString() })
    .eq('id', id).eq('company_id', req.user!.companyId)
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
