import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone          = searchParams.get('phone')
  const id_proof_number = searchParams.get('id_proof_number')

  if (!phone && !id_proof_number) {
    return NextResponse.json({ error: 'phone or id_proof_number required' }, { status: 400 })
  }

  const CID = await resolveCompanyId()
  const sb  = createAdminClient()

  let q = sb
    .from('blacklist')
    .select('id, name, phone, severity, reason, photo_url, incident_date, status')
    .eq('status', 'active')

  if (CID) q = q.eq('company_id', CID)

  const filters: string[] = []
  if (phone)           filters.push(`phone.eq.${phone}`)
  if (id_proof_number) filters.push(`id_proof_number.eq.${id_proof_number}`)

  if (filters.length > 1) {
    q = q.or(filters.join(','))
  } else if (phone) {
    q = q.eq('phone', phone)
  } else if (id_proof_number) {
    q = q.eq('id_proof_number', id_proof_number)
  }

  const { data } = await q

  if (!data || data.length === 0) return NextResponse.json({ blacklisted: false })
  return NextResponse.json({ blacklisted: true, entry: data[0] })
}
