import { createClient } from '@supabase/supabase-js'

// Service-role client for backend — full DB access, bypasses RLS
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
