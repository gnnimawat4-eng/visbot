'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Ban, Plus, Search, Phone, MapPin, Package, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Vendor {
  id: string
  vendor_code: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  vendor_type: string
  rating: number
  is_active: boolean
  is_preferred: boolean
  is_blacklisted: boolean
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  supplier:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  contractor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  courier:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  service:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  other:      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      <Star size={12} fill="currentColor" />
      <span className="text-xs text-gray-600 dark:text-gray-400 ml-0.5">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [filter, setFilter]   = useState('active')
  const [typeFilter, setType] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ status: filter })
    if (q) params.set('q', q)
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/vendors?${params}`)
      .then(r => r.json())
      .then(d => { setVendors(d.vendors ?? []); setLoading(false) })
  }, [q, filter, typeFilter])

  const stats = {
    total: vendors.length,
    preferred: vendors.filter(v => v.is_preferred).length,
    blacklisted: vendors.filter(v => v.is_blacklisted).length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage supplier and contractor database</p>
        </div>
        <Link href="/dashboard/vendors/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--vb-accent)' }}>
          <Plus size={16} /> Add Vendor
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Vendors', value: stats.total, icon: Package, color: 'text-blue-500' },
          { label: 'Preferred', value: stats.preferred, icon: Star, color: 'text-amber-500' },
          { label: 'Blacklisted', value: stats.blacklisted, icon: Ban, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search vendors…"
            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-56" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { key: 'active', label: 'All' },
            { key: 'preferred', label: '⭐ Preferred' },
            { key: 'blacklisted', label: '🚫 Blacklisted' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setType(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All Types</option>
          {['supplier','contractor','courier','service','other'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table / Cards */}
      {loading ? <Skeleton /> : vendors.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No vendors found</p>
          <Link href="/dashboard/vendors/new" className="mt-3 inline-block text-sm text-brand-500 hover:underline">Add first vendor →</Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Code', 'Name', 'Phone', 'Type', 'City', 'Rating', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{v.vendor_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        {v.name}
                        {v.is_preferred && <Star size={12} className="text-amber-400 fill-amber-400" />}
                        {v.is_blacklisted && <Ban size={12} className="text-red-500" />}
                      </div>
                      {v.contact_person && <div className="text-xs text-gray-500 dark:text-gray-400">{v.contact_person}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${TYPE_COLORS[v.vendor_type] ?? TYPE_COLORS.other}`}>
                        {v.vendor_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.city ?? '—'}</td>
                    <td className="px-4 py-3"><Stars rating={v.rating} /></td>
                    <td className="px-4 py-3">
                      {v.is_blacklisted
                        ? <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Blacklisted</span>
                        : v.is_active
                          ? <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Active</span>
                          : <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/vendors/${v.id}`} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {vendors.map(v => (
              <Link key={v.id} href={`/dashboard/vendors/${v.id}`}
                className="block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {v.name}
                      {v.is_preferred && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.vendor_code}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${TYPE_COLORS[v.vendor_type] ?? TYPE_COLORS.other}`}>{v.vendor_type}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {v.phone && <span className="flex items-center gap-1"><Phone size={11} />{v.phone}</span>}
                  {v.city && <span className="flex items-center gap-1"><MapPin size={11} />{v.city}</span>}
                  <Stars rating={v.rating} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
