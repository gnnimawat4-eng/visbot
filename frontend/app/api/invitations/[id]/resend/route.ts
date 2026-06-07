import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb  = createAdminClient()
  const CID = await resolveCompanyId()

  const { data: inv } = await sb
    .from('invitations')
    .select('*, host:profiles(id, full_name, phone), company:companies(name)')
    .eq('id', params.id)
    .single()

  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (CID && inv.company_id !== CID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // In production, send SMS/WhatsApp with invite link
  // For demo, just return the invite URL
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/invite/${inv.qr_token}`

  return NextResponse.json({
    ok: true,
    invite_url: inviteUrl,
    message: `Resend triggered for ${inv.visitor_phone}`,
  })
}
