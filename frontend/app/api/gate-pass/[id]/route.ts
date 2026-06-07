import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('gate_passes')
    .select('*, guard:profiles(full_name, phone), company:companies(name, logo_url)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ gate_pass: data })
}
