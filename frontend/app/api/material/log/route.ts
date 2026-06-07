import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  checkin_id:       z.string().uuid(),
  company_id:       z.string().uuid(),
  item_name:        z.string().min(1),
  quantity:         z.number().int().positive(),
  direction:        z.enum(['in', 'out']),
  return_expected:  z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const data = schema.parse(await req.json())
  const supabase = createClient()
  const { data: material, error } = await supabase.from('materials').insert(data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material })
}
