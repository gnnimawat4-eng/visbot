// Photo upload — always uses service-role client server-side (bypasses storage RLS)
export async function uploadPhoto(file: File | Blob, filename?: string): Promise<string> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  const name     = filename ?? `visitors/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('photos')
    .upload(name, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('photos').getPublicUrl(name)
  return data.publicUrl
}
