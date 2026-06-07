import { createClient, createAdminClient } from '@/lib/supabase/server'

const ENV_CID = process.env.NEXT_PUBLIC_COMPANY_ID ?? null

/**
 * Resolves the company_id for the current request:
 * 1. Session user's profile.company_id
 * 2. Falls back to NEXT_PUBLIC_COMPANY_ID env var
 */
export async function resolveCompanyId(): Promise<string | null> {
  try {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return ENV_CID
    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    return data?.company_id ?? ENV_CID
  } catch {
    return ENV_CID
  }
}
