import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function POST() {
  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  // Simulate sending - log it
  const { data: settings } = await sb.from('report_settings').select('*').eq('company_id', CID!).single()

  const { error } = await sb.from('report_logs').insert({
    company_id: CID,
    report_type: 'daily',
    channel: 'email',
    recipients: settings?.email_recipients ?? [],
    status: 'sent',
    report_data: { test: true, sent_at: new Date().toISOString() },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: 'Test report logged. Email sending requires Resend API key.' })
}
