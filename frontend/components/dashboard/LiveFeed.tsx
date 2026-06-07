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

const AVATAR_COLORS = [
  { bg: '#ECFDF5', text: '#059669' },
  { bg: '#EFF6FF', text: '#2563EB' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#FDF4FF', text: '#9333EA' },
  { bg: '#FFF1F2', text: '#E11D48' },
  { bg: '#F0F9FF', text: '#0284C7' },
]

function avatarColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function FeedSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F5F5F5' }}>
          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: '#F5F5F5' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded" style={{ background: '#F5F5F5' }} />
            <div className="h-2.5 w-20 rounded" style={{ background: '#F5F5F5' }} />
          </div>
          <div className="h-5 w-10 rounded-full" style={{ background: '#F5F5F5' }} />
        </div>
      ))}
    </div>
  )
}

export function LiveFeed() {
  const [feed,    setFeed]    = useState<FeedRow[]>([])
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
    <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '20px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>Live Check-in Feed</h2>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: '#ECFDF5', color: '#059669' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
          Live
        </div>
      </div>

      {loading ? (
        <FeedSkeleton />
      ) : feed.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No check-ins yet today</p>
      ) : (
        <div>
          {feed.map(row => {
            const name = row.visitor?.name ?? '?'
            const color = avatarColor(name)
            return (
              <div
                key={row.id}
                className="flex items-center gap-3 py-2.5 -mx-1 px-1 rounded-lg transition-colors last:border-0"
                style={{ borderBottom: '1px solid #F5F5F5' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                {row.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {initials(name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#0A0A0A' }}>{name}</p>
                  <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{row.purpose} · {row.host_name}</p>
                </div>
                <span
                  className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={row.status === 'checked_in'
                    ? { background: '#ECFDF5', color: '#059669' }
                    : { background: '#FEF2F2', color: '#DC2626' }
                  }
                >
                  {row.status === 'checked_in' ? 'In' : 'Out'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
