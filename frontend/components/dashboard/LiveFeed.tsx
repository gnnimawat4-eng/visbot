'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeedRow {
  id: string
  visitor: { name: string; phone: string } | null
  purpose: string
  host_name: string
  photo_url: string | null
  status: 'checked_in' | 'checked_out'
  created_at: string
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function FeedSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          <div className="h-5 w-8 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function LiveFeed() {
  const [feed, setFeed]       = useState<FeedRow[]>([])
  const [loading, setLoading] = useState(true)
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/feed')
      .then(r => r.json())
      .then(d => { setFeed(d.feed ?? []); setLoading(false) })
      .catch(() => setLoading(false))

    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-checkins')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins',
          ...(companyId ? { filter: `company_id=eq.${companyId}` } : {}) },
        () => { fetch('/api/dashboard/feed').then(r => r.json()).then(d => setFeed(d.feed ?? [])).catch(() => {}) },
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [companyId])

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Live check-in feed</h2>
        <span className="text-xs bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">● Live</span>
      </div>

      {loading ? (
        <FeedSkeleton />
      ) : feed.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No check-ins yet today</p>
      ) : (
        <div className="space-y-0">
          {feed.map(row => (
            <div key={row.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
              {row.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-xs font-semibold text-brand-600 dark:text-brand-400 flex-shrink-0">
                  {initials(row.visitor?.name ?? '?')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{row.visitor?.name ?? '—'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{row.purpose} · {row.host_name}</p>
              </div>
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                row.status === 'checked_in'
                  ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {row.status === 'checked_in' ? 'In' : 'Out'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
