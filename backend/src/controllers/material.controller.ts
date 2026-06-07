import type { Request, Response } from 'express'
import { supabase } from '../services/supabase'

export const MaterialController = {
  async log(req: Request, res: Response) {
    const { checkin_id, item_name, quantity, direction, return_expected } = req.body
    const company_id = res.locals.company_id
    const { data, error } = await supabase
      .from('materials')
      .insert({ checkin_id, company_id, item_name, quantity, direction, return_expected })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ material: data })
  },

  async active(req: Request, res: Response) {
    const company_id = res.locals.company_id
    const { data, error } = await supabase
      .from('materials')
      .select('*, checkin:checkins(visitor:visitors(name))')
      .eq('company_id', company_id)
      .eq('direction', 'out')
      .is('returned_at', null)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ materials: data })
  },

  async markReturned(req: Request, res: Response) {
    const { data, error } = await supabase
      .from('materials')
      .update({ returned_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ material: data })
  },
}
