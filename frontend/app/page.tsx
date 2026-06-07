import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Look up role from profiles
  const admin   = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/setup')

  switch (profile.role) {
    case 'saas_owner': redirect('/owner/dashboard')
    case 'admin':      redirect('/dashboard')
    case 'guard':      redirect('/guard')
    default:           redirect('/auth/setup')
  }
}
