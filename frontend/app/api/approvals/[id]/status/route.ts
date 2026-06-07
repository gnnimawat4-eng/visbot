import { NextResponse } from 'next/server'
import { createAdminClientRaw as createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createAdminClient()

  const { data, error } = await sb
    .from('approval_requests')
    .select('id, status, approved_at, rejected_at, rejection_reason, expires_at')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ approval: data })
}
