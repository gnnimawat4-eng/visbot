import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/** Returns visitor info + last checkin for returning visitor auto-fill. */
export async function GET(req: NextRequest) {
  const phone = new URL(req.url).searchParams.get('phone')?.trim()
  if (!phone) return NextResponse.json({ found: false })

  const sb = createAdminClient()
  const { data: visitor } = await sb
    .from('visitors')
    .select('id,name,phone,last_company_id')
    .eq('phone', phone)
    .single()

  if (!visitor) return NextResponse.json({ found: false })

  const { data: lastCheckin } = await sb
    .from('checkins')
    .select('purpose,host_name,host_phone,created_at')
    .eq('visitor_id', visitor.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ found: true, visitor, lastCheckin: lastCheckin ?? null })
}
