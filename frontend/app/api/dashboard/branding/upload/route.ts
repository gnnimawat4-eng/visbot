import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveCompanyId } from '@/lib/resolveCompanyId'

const ALLOWED_TYPES = ['logo', 'signature', 'stamp'] as const
const BUCKET = 'company-assets'

export async function POST(req: NextRequest) {
  const companyId = await resolveCompanyId()
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null

  if (!file || !type) return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
    return NextResponse.json({ error: 'type must be logo | signature | stamp' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 2 MB limit' }, { status: 400 })
  }

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${companyId}/${type}.${ext}`

  const supabase = createAdminClient()

  // Create bucket on first use (no-op if already exists)
  await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 2097152 })

  const bytes = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
