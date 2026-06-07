'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Invitation {
  id: string
  visitor_name: string
  visitor_phone: string
  host_name: string
  purpose: string
  scheduled_date: string
  scheduled_time?: string
  invite_code: string
  qr_token: string
  status: string
  notes?: string
}

export default function ExpectedPage() {
  const router = useRouter()
  const [rows, setRows]     = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invitations/expected')
      .then(r => r.json())
      .then(d => { setRows(d.invitations ?? []); setLoading(false) })
  }, [])

  async function handleUse(inv: Invitation) {
    if (!confirm(`Check in ${inv.visitor_name}?`)) return
    const res = await fetch(`/api/invitations/${inv.id}/use`, { method: 'POST' })
    if (res.ok) {
      setRows(prev => prev.filter(r => r.id !== inv.id))
      alert(`${inv.visitor_name} checked in successfully!`)
    } else {
      const d = await res.json()
      alert(d.error ?? 'Failed to check in')
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--vb-bg-page)' }}>
      <div style={{ background: 'var(--vb-bg-sidebar)', borderBottom: '1px solid var(--vb-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()} style={{ color: 'var(--vb-text-secondary)', fontSize: 20 }}>←</button>
          <div className="flex-1">
            <p style={{ color: 'var(--vb-text-primary)', fontWeight: 700, fontSize: 16 }}>Expected Today</p>
            <p style={{ color: 'var(--vb-text-secondary)', fontSize: 12 }}>Pre-approved visitors</p>
          </div>
          <Link href="/guard/scan" className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg">
            Scan QR
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))
        ) : rows.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-gray-500 dark:text-gray-400">No visitors expected today</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Pre-approve visitors from the dashboard</p>
          </div>
        ) : (
          rows.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white text-base">{inv.visitor_name}</p>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-semibold">
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{inv.visitor_phone}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Host: <span className="font-semibold">{inv.host_name}</span></p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="capitalize">{inv.purpose}</span>
                    {inv.scheduled_time && <span>· {inv.scheduled_time}</span>}
                    <span className="font-mono">· {inv.invite_code}</span>
                  </div>
                  {inv.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{inv.notes}</p>}
                </div>
                <button onClick={() => handleUse(inv)}
                  className="shrink-0 px-3 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors">
                  Check In
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
