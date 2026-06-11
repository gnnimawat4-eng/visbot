import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name:       z.string().min(2),
  phone:      z.string().min(10),
  purpose:    z.string().min(1),
  host:       z.string().min(2),
  company_id: z.string().uuid(),
  photo_url:  z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  const data = schema.parse(await req.json())
  const supabase = createClient()

  const { data: visitor } = await supabase
    .from('visitors')
    .upsert({ name: data.name, phone: data.phone, last_company_id: data.company_id }, { onConflict: 'phone' })
    .select('id').single()

  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({ visitor_id: visitor!.id, company_id: data.company_id,
              purpose: data.purpose, host_name: data.host,
              photo_url: data.photo_url, status: 'checked_in' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkin })
}
