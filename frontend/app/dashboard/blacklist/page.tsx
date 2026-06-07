'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface BlacklistEntry {
  id: string
  name: string
  phone?: string
  id_proof_number?: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'lifted'
  created_at: string
  lifted_at?: string
  lifted_reason?: string
}

const SEVERITY_STYLE: Record<string, string> = {
  low:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  high:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function BlacklistPage() {
  const [rows,    setRows]    = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('active')
  const [q,       setQ]       = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ status })
    if (q) params.set('q', q)
    fetch(`/api/blacklist?${params}`).then(r => r.json()).then(d => {
      setRows(d.entries ?? [])
      setLoading(false)
    })
  }, [status, q])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blacklist</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage blocked individuals</p>
        </div>
        <Link href="/dashboard/blacklist/new"
          className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors">
          + Add to Blacklist
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or phone…"
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 w-64"
        />
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {['active', 'lifted'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                status === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">🛡️</p>
          <p className="font-semibold">No {status} blacklist entries</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <Link key={row.id} href={`/dashboard/blacklist/${row.id}`}
              className="block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 dark:text-white">{row.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_STYLE[row.severity]}`}>
                      {row.severity}
                    </span>
                    {row.status === 'lifted' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        lifted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{row.phone} {row.id_proof_number ? `· ${row.id_proof_number}` : ''}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{row.reason}</p>
                </div>
                <span className="text-gray-300 dark:text-gray-600 text-lg shrink-0">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
