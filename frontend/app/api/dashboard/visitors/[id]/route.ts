import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createAdminClient()

  const { data: checkin, error } = await sb
    .from('checkins')
    .select('*, visitor:visitors(name,phone,email)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: sms_logs } = await sb
    .from('sms_logs')
    .select('*')
    .eq('checkin_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ checkin, sms_logs: sms_logs ?? [] })
}
