'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Ban, Phone, Mail, MapPin, Package, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Vendor {
  id: string; vendor_code: string; name: string; contact_person: string | null; phone: string | null
  email: string | null; city: string | null; state: string | null; address: string | null
  gst_number: string | null; vendor_type: string; services_provided: string | null
  rating: number; notes: string | null; is_active: boolean; is_preferred: boolean
  is_blacklisted: boolean; blacklist_reason: string | null; created_at: string
}
interface Material { id: string; item_name: string; direction: string; quantity: number; value_inr: number | null; created_at: string }

const TAB_CLASSES = (active: boolean) => `px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData]     = useState<{ vendor: Vendor; materials: Material[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'overview' | 'materials'>('overview')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    fetch(`/api/vendors/${id}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [id])

  async function togglePreferred() {
    if (!data) return
    setSaving(true)
    const res = await fetch(`/api/vendors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_preferred: !data.vendor.is_preferred }),
    })
    const d = await res.json()
    if (res.ok) { setData(prev => prev ? { ...prev, vendor: d.vendor } : null); toast.success(d.vendor.is_preferred ? 'Marked as preferred' : 'Removed from preferred') }
    setSaving(false)
  }

  async function handleDeactivate() {
    if (!confirm('Deactivate this vendor?')) return
    const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Vendor deactivated'); router.push('/dashboard/vendors') }
  }

  if (loading) return (
    <div className="space-y-4">
      {[200, 100, 300].map(h => <div key={h} className={`h-${h === 200 ? 48 : h === 100 ? 24 : 64} rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800`} />)}
    </div>
  )
  if (!data) return <div className="text-center py-16 text-gray-500">Vendor not found</div>

  const { vendor, materials } = data
  const totalValue = materials.filter(m => m.value_inr).reduce((s, m) => s + (m.value_inr ?? 0), 0)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/vendors" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.name}</h1>
            {vendor.is_preferred && <Star size={16} className="text-amber-400 fill-amber-400" />}
            {vendor.is_blacklisted && <Ban size={16} className="text-red-500" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{vendor.vendor_code} · {vendor.vendor_type}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={togglePreferred} disabled={saving}
            className="p-2 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            title={vendor.is_preferred ? 'Remove preferred' : 'Mark preferred'}>
            <Star size={16} className={vendor.is_preferred ? 'fill-amber-400' : ''} />
          </button>
          <button onClick={handleDeactivate}
            className="p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Deactivate vendor">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {(['overview', 'materials'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={TAB_CLASSES(tab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Contact */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {vendor.contact_person && <div><span className="text-gray-500 dark:text-gray-400">Contact:</span> <span className="font-medium text-gray-900 dark:text-white ml-1">{vendor.contact_person}</span></div>}
              {vendor.phone && <div className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{vendor.phone}</span></div>}
              {vendor.email && <div className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{vendor.email}</span></div>}
              {vendor.city && <div className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{vendor.city}{vendor.state ? `, ${vendor.state}` : ''}</span></div>}
              {vendor.gst_number && <div><span className="text-gray-500 dark:text-gray-400">GST:</span> <span className="font-mono text-xs ml-1 text-gray-700 dark:text-gray-300">{vendor.gst_number}</span></div>}
            </div>
            {vendor.services_provided && <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">{vendor.services_provided}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Transactions', value: materials.length },
              { label: 'Total Value', value: `₹${(totalValue/1000).toFixed(0)}K` },
              { label: 'Rating', value: `${vendor.rating.toFixed(1)} ★` },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {vendor.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">📝 {vendor.notes}</p>
            </div>
          )}

          {vendor.is_blacklisted && vendor.blacklist_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">🚫 Blacklisted: {vendor.blacklist_reason}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <Package size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No material transactions yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                {['Item', 'Direction', 'Qty', 'Value', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.item_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${m.direction === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                        {m.direction === 'in' ? '↓ IN' : '↑ OUT'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.quantity}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.value_inr ? `₹${m.value_inr.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(m.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
