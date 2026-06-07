import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CheckInRecord {
  id: string
  visitor: { name: string; phone: string }
  purpose: string
  host_name: string
  photo_url: string | null
  status: 'checked_in' | 'checked_out'
  created_at: string
}

export function useRealtimeFeed(companyId: string) {
  const [feed, setFeed] = useState<CheckInRecord[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('checkins')
      .select('*, visitor:visitors(name, phone)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setFeed((data as CheckInRecord[]) ?? []))

    const channel = supabase
      .channel(`checkins:${companyId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins', filter: `company_id=eq.${companyId}` },
        (payload) => setFeed((prev) => [payload.new as CheckInRecord, ...prev.slice(0, 19)]),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [companyId])

  return feed
}
