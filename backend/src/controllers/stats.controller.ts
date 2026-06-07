import type { Request, Response } from 'express'
import { supabase } from '../services/supabase'

export const StatsController = {
  async summary(req: Request, res: Response) {
    const company_id = res.locals.company_id
    const today      = new Date().toISOString().split('T')[0]
    const [total, inside, materials] = await Promise.all([
      supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('company_id', company_id).gte('created_at', today),
      supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('company_id', company_id).eq('status', 'checked_in'),
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('company_id', company_id).eq('direction', 'out').is('returned_at', null),
    ])
    return res.json({ total: total.count, inside: inside.count, materialsOut: materials.count })
  },

  async daily(_req: Request, res: Response) { return res.json({ msg: 'TODO: daily breakdown' }) },
  async weekly(_req: Request, res: Response) { return res.json({ msg: 'TODO: weekly chart data' }) },
}
