import type { Request, Response } from 'express'
import { supabase } from '../services/supabase'

export const VisitorController = {
  async list(req: Request, res: Response) {
    const company_id = res.locals.company_id
    const { data, error } = await supabase
      .from('visitors')
      .select('*, checkins(count)')
      .eq('last_company_id', company_id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ visitors: data })
  },

  async search(req: Request, res: Response) {
    const { q } = req.query as { q: string }
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(10)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ visitors: data })
  },

  async get(req: Request, res: Response) {
    const { data, error } = await supabase
      .from('visitors').select('*').eq('id', req.params.id).single()
    if (error) return res.status(404).json({ error: 'Not found' })
    return res.json({ visitor: data })
  },

  async history(req: Request, res: Response) {
    const { data, error } = await supabase
      .from('checkins')
      .select('*, materials(*)')
      .eq('visitor_id', req.params.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ history: data })
  },
}
