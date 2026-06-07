'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  status: 'pending' | 'used' | 'cancelled' | 'expired'
  notes?: string
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  used:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  expired:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const TABS = ['today', 'upcoming', 'past', 'cancelled'] as const
type Tab = typeof TABS[number]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InvitationsPage() {
  const [tab, setTab]               = useState<Tab>('today')
  const [rows, setRows]             = useState<Invitation[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000
    const now = new Date(Date.now() + IST_OFFSET)
    const today = now.toISOString().split('T')[0]
    let url = '/api/invitations?'
    if (tab === 'today')     url += `date_from=${today}&date_to=${today}&status=pending`
    if (tab === 'upcoming')  url += `date_from=${today}`
    if (tab === 'past')      url += `date_to=${today}&status=used`
    if (tab === 'cancelled') url += `status=cancelled`
    fetch(url).then(r => r.json()).then(d => { setRows(d.invitations ?? []); setLoading(false) })
  }, [tab])

  async function cancel(id: string) {
    if (!confirm('Cancel this invitation?')) return
    await fetch(`/api/invitations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Pre-approve visitors with QR codes</p>
        </div>
        <Link href="/dashboard/invitations/new"
          className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors">
          + New Invitation
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">No invitations found</p>
          <p className="text-sm mt-1">Create one to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(inv => (
            <div key={inv.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white">{inv.visitor_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[inv.status]}`}>
                    {inv.status}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-mono">
                    {inv.invite_code}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {inv.visitor_phone} · Host: {inv.host_name} · {inv.purpose}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  📅 {formatDate(inv.scheduled_date)}{inv.scheduled_time ? ` at ${inv.scheduled_time}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/dashboard/invitations/${inv.id}`}
                  className="px-3 py-1.5 text-xs font-semibold text-brand-600 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                  View QR
                </Link>
                {inv.status === 'pending' && (
                  <button onClick={() => cancel(inv.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
