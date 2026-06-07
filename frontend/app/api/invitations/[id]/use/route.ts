import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({})) as { photo_url?: string }
  const sb   = createAdminClient()

  // Fetch invitation with host profile
  const { data: inv } = await sb
    .from('invitations')
    .select('*, host:profiles(id, full_name, phone)')
    .eq('id', params.id)
    .single()

  if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  if (inv.status !== 'pending') return NextResponse.json({ error: `Invitation is ${inv.status}` }, { status: 400 })

  const host = inv.host as { full_name?: string; phone?: string } | null

  // Upsert visitor
  const { data: visitor } = await sb
    .from('visitors')
    .upsert({ name: inv.visitor_name, phone: inv.visitor_phone }, { onConflict: 'phone' })
    .select()
    .single()

  if (!visitor) return NextResponse.json({ error: 'Failed to upsert visitor' }, { status: 500 })

  // Create checkin
  const { data: checkin, error: ci } = await sb
    .from('checkins')
    .insert({
      visitor_id:    visitor.id,
      company_id:    inv.company_id ?? '',
      purpose:       inv.purpose,
      host_name:     host?.full_name ?? 'Unknown',
      host_phone:    host?.phone     ?? null,
      status:        'checked_in',
      photo_url:     body.photo_url  ?? null,
      invitation_id: inv.id,
    })
    .select()
    .single()

  if (ci) return NextResponse.json({ error: ci.message }, { status: 500 })

  // Mark invitation used
  await sb.from('invitations').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', params.id)

  return NextResponse.json({ checkin, ok: true })
}
