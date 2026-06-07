import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('gate_passes')
    .update({ status: 'exited', checked_out_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ gate_pass: data })
}
