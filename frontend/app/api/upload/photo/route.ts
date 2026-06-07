import { NextRequest, NextResponse } from 'next/server'
import { uploadPhoto } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('photo') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  const url = await uploadPhoto(file)
  return NextResponse.json({ url })
}
