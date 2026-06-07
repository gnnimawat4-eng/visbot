'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Package, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Material {
  id: string; item_name: string; quantity: number; direction: string
  value_inr: number | null; vendor_name: string | null; entry_photo_url: string | null
  approval_status: string; created_at: string
  category: { name: string; icon: string | null; color: string | null } | null
  vendor: { name: string; phone: string | null } | null
}

function Skeleton() {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}
  </div>
}

export default function PendingApprovalPage() {
  const [items, setItems]   = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [rejId, setRejId]   = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  function load() {
    fetch('/api/materials/pending').then(r => r.json()).then(d => { setItems(d.materials ?? []); setLoading(false) })
  }
  useEffect(load, [])

  async function approve(id: string) {
    setActing(true)
    const res = await fetch(`/api/materials/${id}/approve`, { method: 'POST' })
    if (res.ok) { toast.success('Material approved'); setItems(p => p.filter(i => i.id !== id)) }
    else toast.error('Failed to approve')
    setActing(false)
  }

  async function reject(id: string) {
    if (!reason.trim()) return toast.error('Rejection reason required')
    setActing(true)
    const res = await fetch(`/api/materials/${id}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: reason }),
    })
    if (res.ok) { toast.success('Material rejected'); setItems(p => p.filter(i => i.id !== id)); setRejId(null); setReason('') }
    else toast.error('Failed to reject')
    setActing(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Approval</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Materials awaiting admin review</p>
        </div>
        {items.length > 0 && (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full text-sm font-semibold">
            {items.length} pending
          </span>
        )}
      </div>

      {loading ? <Skeleton /> : items.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="mx-auto text-green-400 mb-3" size={48} />
          <p className="font-semibold text-gray-700 dark:text-gray-300">All caught up!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No materials pending approval</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800/50 rounded-lg overflow-hidden">
              {item.entry_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.entry_photo_url} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Package size={32} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.item_name}</h3>
                    {item.category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.category.icon} {item.category.name}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${item.direction === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    {item.direction === 'in' ? '↓ IN' : '↑ OUT'}
                  </span>
                </div>

                <div className="text-sm space-y-1">
                  {item.value_inr && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Value</span><span className="font-medium text-gray-900 dark:text-white">₹{item.value_inr.toLocaleString()}</span></div>}
                  {item.vendor && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Vendor</span><span className="text-gray-700 dark:text-gray-300">{item.vendor.name}</span></div>}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={11} /> Waiting</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {rejId === item.id ? (
                  <div className="space-y-2">
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                      placeholder="Rejection reason…"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => reject(item.id)} disabled={acting}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500 text-white disabled:opacity-60">
                        Confirm Reject
                      </button>
                      <button onClick={() => { setRejId(null); setReason('') }}
                        className="px-3 py-2 rounded-lg text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => approve(item.id)} disabled={acting}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-500 text-white flex items-center justify-center gap-1 disabled:opacity-60">
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button onClick={() => setRejId(item.id)} disabled={acting}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex items-center justify-center gap-1">
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
