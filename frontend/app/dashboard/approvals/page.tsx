'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, Clock, Star, Package, AlertCircle, History } from 'lucide-react'
import toast from 'react-hot-toast'

interface Approval {
  id: string; request_code: string; request_type: string; status: string
  visitor_name: string | null; visitor_phone: string | null; visitor_photo_url: string | null
  visitor_purpose: string | null; visitor_company: string | null; visitor_vip_reason: string | null
  material_description: string | null; material_value: number | null; material_photo_url: string | null
  requested_at: string; approved_at: string | null; rejected_at: string | null
  rejection_reason: string | null; expires_at: string
  requester: { full_name: string } | null
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const m = Math.floor(secs / 60), s = secs % 60
  const urgent = secs < 120
  return (
    <span className={`text-xs font-mono font-semibold ${urgent ? 'text-red-500' : 'text-orange-500'}`}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

function elapsed(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function ApprovalCard({ item, onApprove, onReject, acting }: {
  item: Approval
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  acting: boolean
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const isVIP = item.request_type === 'vip_visitor'

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg overflow-hidden border-2 ${item.status === 'pending' ? (isVIP ? 'border-amber-300 dark:border-amber-700' : 'border-orange-300 dark:border-orange-700') : 'border-gray-100 dark:border-gray-800'}`}>
      {/* Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${isVIP ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
        <div className="flex items-center gap-2">
          {isVIP ? <Star size={14} className="text-amber-500 fill-amber-500" /> : <Package size={14} className="text-orange-500" />}
          <span className={`text-xs font-semibold uppercase tracking-wide ${isVIP ? 'text-amber-700 dark:text-amber-400' : 'text-orange-700 dark:text-orange-400'}`}>
            {isVIP ? 'VIP Visitor' : 'High Value Material'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.request_code}</span>
        </div>
        {item.status === 'pending' && <Countdown expiresAt={item.expires_at} />}
        {item.status === 'approved' && <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle size={11} />Approved</span>}
        {item.status === 'rejected' && <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"><XCircle size={11} />Rejected</span>}
        {item.status === 'expired' && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Expired</span>}
      </div>

      {/* Photo */}
      {(item.visitor_photo_url || item.material_photo_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.visitor_photo_url ?? item.material_photo_url ?? ''} alt="" className="w-full h-40 object-cover object-top" />
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {isVIP ? (
          <>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.visitor_name}</h3>
              {item.visitor_company && <p className="text-sm text-gray-500 dark:text-gray-400">{item.visitor_company}</p>}
            </div>
            {item.visitor_purpose && <p className="text-sm text-gray-700 dark:text-gray-300">Purpose: {item.visitor_purpose}</p>}
            {item.visitor_vip_reason && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800 dark:text-amber-300">⭐ {item.visitor_vip_reason}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.material_description}</h3>
            {item.material_value && <p className="text-lg font-semibold text-red-600 dark:text-red-400">₹{item.material_value.toLocaleString()}</p>}
          </>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Guard: {item.requester?.full_name ?? 'Unknown'}</span>
          <span>{elapsed(item.requested_at)}</span>
        </div>

        {item.status === 'rejected' && item.rejection_reason && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            <p className="text-xs text-red-700 dark:text-red-300">Reason: {item.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        {item.status === 'pending' && (
          rejecting ? (
            <div className="space-y-2">
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="Rejection reason…"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => onReject(item.id, reason)} disabled={acting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-60">Confirm Reject</button>
                <button onClick={() => { setRejecting(false); setReason('') }}
                  className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => onApprove(item.id)} disabled={acting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-500 text-white flex items-center justify-center gap-1.5 disabled:opacity-60">
                <CheckCircle size={14} /> Approve
              </button>
              <button onClick={() => setRejecting(true)} disabled={acting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex items-center justify-center gap-1.5">
                <XCircle size={14} /> Reject
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const [pending,  setPending]  = useState<Approval[]>([])
  const [history,  setHistory]  = useState<Approval[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'pending' | 'history'>('pending')
  const [acting,   setActing]   = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function loadPending() {
    const res = await fetch('/api/approvals?status=pending')
    const d = await res.json()
    setPending(d.approvals ?? [])
  }

  async function loadHistory() {
    const res = await fetch('/api/approvals')
    const d = await res.json()
    setHistory((d.approvals ?? []).filter((a: Approval) => a.status !== 'pending'))
  }

  useEffect(() => {
    Promise.all([loadPending(), loadHistory()]).finally(() => setLoading(false))
    pollRef.current = setInterval(loadPending, 10000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function approve(id: string) {
    setActing(true)
    const res = await fetch(`/api/approvals/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      toast.success('Approved! Guard has been notified.')
      await loadPending(); await loadHistory()
    } else toast.error('Failed to approve')
    setActing(false)
  }

  async function reject(id: string, reason: string) {
    if (!reason.trim()) return toast.error('Reason required')
    setActing(true)
    const res = await fetch(`/api/approvals/${id}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: reason }),
    })
    if (res.ok) {
      toast.success('Rejected. Guard notified.')
      await loadPending(); await loadHistory()
    } else toast.error('Failed to reject')
    setActing(false)
  }

  const TAB = (t: typeof tab, label: string, count?: number) => (
    <button onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
      {label}
      {count !== undefined && count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white font-semibold">{count}</span>
      )}
    </button>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Approvals
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">{pending.length}</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">VIP visitors and high-value material requests</p>
        </div>
        {pending.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertCircle size={14} className="text-red-500 animate-pulse" />
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">{pending.length} need action</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {TAB('pending', '⏳ Pending', pending.length)}
        {TAB('history', 'History')}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="mx-auto text-green-400 mb-3" size={48} />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No pending approvals</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Refreshing every 10 seconds</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map(item => (
              <ApprovalCard key={item.id} item={item} onApprove={approve} onReject={reject} acting={acting} />
            ))}
          </div>
        )
      ) : (
        history.length === 0 ? (
          <div className="text-center py-16">
            <History size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No history yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(item => (
              <ApprovalCard key={item.id} item={item} onApprove={approve} onReject={reject} acting={acting} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
