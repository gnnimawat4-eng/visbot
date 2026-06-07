'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface BlacklistEntry {
  id: string
  name: string
  phone?: string
  id_proof_number?: string
  reason: string
  severity: string
  status: string
  notes?: string
  created_at: string
  lifted_at?: string
  lifted_reason?: string
  attempts?: {
    id: string
    guard_id: string
    phone?: string
    name?: string
    notes?: string
    created_at: string
  }[]
}

const SEVERITY_STYLE: Record<string, string> = {
  low:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  high:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 text-right max-w-xs">{value}</span>
    </div>
  )
}

export default function BlacklistDetailPage() {
  const { id }  = useParams()
  const router  = useRouter()
  const [entry,   setEntry]   = useState<BlacklistEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [liftReason, setLiftReason] = useState('')
  const [lifting, setLifting] = useState(false)
  const [showLift, setShowLift] = useState(false)

  useEffect(() => {
    fetch(`/api/blacklist/${id}`).then(r => r.json()).then(d => {
      setEntry(d.entry)
      setLoading(false)
    })
  }, [id])

  async function handleLift() {
    if (!liftReason.trim()) { alert('Please provide a reason for lifting'); return }
    setLifting(true)
    const res = await fetch(`/api/blacklist/${id}/lift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lifted_reason: liftReason }),
    })
    if (res.ok) {
      router.push('/dashboard/blacklist')
    } else {
      const d = await res.json()
      alert(d.error ?? 'Failed to lift')
    }
    setLifting(false)
  }

  if (loading) return <div className="p-6 animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" /><div className="h-60 bg-gray-100 dark:bg-gray-900 rounded-lg" /></div>
  if (!entry) return <div className="p-6 text-gray-500">Entry not found</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{entry.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_STYLE[entry.severity]}`}>
              {entry.severity}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              entry.status === 'active' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {entry.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
        <Row label="Phone"       value={entry.phone} />
        <Row label="ID Proof"    value={entry.id_proof_number} />
        <Row label="Reason"      value={entry.reason} />
        <Row label="Notes"       value={entry.notes} />
        <Row label="Added On"    value={new Date(entry.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} />
        {entry.lifted_at && <Row label="Lifted On"    value={new Date(entry.lifted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} />}
        {entry.lifted_reason && <Row label="Lift Reason" value={entry.lifted_reason} />}
      </div>

      {/* Blocked Attempts */}
      {entry.attempts && entry.attempts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Blocked Attempts ({entry.attempts.length})
          </h2>
          <div className="space-y-3">
            {entry.attempts.map(a => (
              <div key={a.id} className="flex items-start justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.name ?? a.phone ?? 'Unknown'}</p>
                  {a.notes && <p className="text-xs text-gray-400 dark:text-gray-500">{a.notes}</p>}
                </div>
                <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {entry.status === 'active' && (
        <>
          {showLift ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Lift Blacklist</h2>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none"
                rows={2} placeholder="Reason for lifting…" value={liftReason} onChange={e => setLiftReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowLift(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Cancel
                </button>
                <button onClick={handleLift} disabled={lifting}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors">
                  {lifting ? 'Lifting…' : 'Confirm Lift'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowLift(true)}
              className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              🔓 Lift Blacklist
            </button>
          )}
        </>
      )}
    </div>
  )
}
