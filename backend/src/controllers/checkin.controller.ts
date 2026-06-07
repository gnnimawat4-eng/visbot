import type { Request, Response } from 'express'
import { supabase } from '../services/supabase'
import { notifyHost } from '../services/notify'

export const CheckinController = {
  async create(req: Request, res: Response) {
    const { visitor_id, purpose, host_name, photo_url, company_id } = req.body
    const { data, error } = await supabase
      .from('checkins')
      .insert({ visitor_id, purpose, host_name, photo_url, company_id, status: 'checked_in' })
      .select('*, visitor:visitors(name, phone)')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    await notifyHost({ host_name, visitor_name: data.visitor.name, purpose })
    return res.json({ checkin: data })
  },

  async checkout(req: Request, res: Response) {
    const { id } = req.params
    const { data, error } = await supabase
      .from('checkins')
      .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
      .eq('id', id)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ checkin: data })
  },

  async today(req: Request, res: Response) {
    const company_id = res.locals.company_id
    const today      = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('checkins')
      .select('*, visitor:visitors(name, phone)')
      .eq('company_id', company_id)
      .gte('created_at', today)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ checkins: data })
  },
}
