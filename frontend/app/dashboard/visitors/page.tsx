'use client'
import { useCallback, useEffect, useState } from 'react'
import { Search, LogOut, RefreshCw, UserPlus, FileDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime, maskPhone } from '@/lib/utils'
import { Modal } from '@/components/dashboard/Modal'
import { ExportPDFModal } from '@/components/dashboard/ExportPDFModal'
import { PhotoCaptureWidget } from '@/components/ui/PhotoCaptureWidget'
import toast from 'react-hot-toast'

interface Visitor { name: string; phone: string; email: string | null }
interface CheckIn {
  id: string
  visitor: Visitor | null
  purpose: string
  host_name: string
  photo_url: string | null
  status: 'checked_in' | 'checked_out'
  checked_out_at: string | null
  created_at: string
}

const PURPOSES = ['meeting', 'delivery', 'interview', 'official', 'other'] as const

const DATE_OPTS = [
  { label: 'Today',       value: new Date().toISOString().split('T')[0] },
  { label: 'Yesterday',   value: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })() },
  { label: 'Last 7 days', value: '' },
  { label: 'All time',    value: '__all__' },
]

const EMPTY_FORM = { name: '', phone: '', purpose: 'meeting' as typeof PURPOSES[number], host_name: '', photo_url: '' }
const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Mobile card ───────────────────────────────────────────────────────
function VisitorCard({ row, onCheckout, checking }: {
  row: CheckIn
  onCheckout: (id: string) => void
  checking: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 relative">
      <div className="flex items-center gap-3 mb-3">
        {row.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={row.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-sm font-bold text-brand-600 flex-shrink-0">
              {initials(row.visitor?.name ?? '?')}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{row.visitor?.name ?? '—'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{maskPhone(row.visitor?.phone ?? '')}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
          row.status === 'checked_in' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {row.status === 'checked_in' ? '● In' : 'Out'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="capitalize">{row.purpose} · {row.host_name}</span>
        <span>{formatTime(row.created_at)}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{formatDate(row.created_at)}</p>
      {row.status === 'checked_in' && (
        <button
          onClick={() => onCheckout(row.id)}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <LogOut size={14} />{checking ? 'Saving…' : 'Check out'}
        </button>
      )}
      {row.status === 'checked_out' && row.checked_out_at && (
        <p className="text-xs text-gray-400 text-right">Out: {formatTime(row.checked_out_at)}</p>
      )}
      <Link href={`/dashboard/visitors/${row.id}`}
        className="absolute top-3 right-3 p-1 rounded text-gray-300 hover:text-brand-500 transition-colors" title="View details">
        <ExternalLink size={13} />
      </Link>
    </div>
  )
}

export default function VisitorsPage() {
  const [rows, setRows]           = useState<CheckIn[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [purpose, setPurpose]     = useState('')
  const [status, setStatus]       = useState('')
  const [date, setDate]           = useState(DATE_OPTS[0].value)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [company, setCompany]     = useState('VisBot Admin')
  const [modalOpen, setModalOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/company').then(r => r.ok ? r.json() : null).then(d => { if (d?.name) setCompany(d.name) }).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search)                     p.set('q', search)
    if (purpose)                    p.set('purpose', purpose)
    if (status)                     p.set('status', status)
    if (date && date !== '__all__') p.set('date', date)
    fetch(`/api/dashboard/visitors?${p}`)
      .then(r => r.json())
      .then(d => { setRows(d.checkins ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search, purpose, status, date])

  useEffect(() => { load() }, [load])

  const checkout = async (id: string) => {
    setCheckingOut(id)
    const res = await fetch(`/api/dashboard/visitors/${id}/checkout`, { method: 'PATCH' })
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'checked_out', checked_out_at: new Date().toISOString() } : r))
      toast.success('Checked out')
    } else toast.error('Checkout failed')
    setCheckingOut(null)
  }

  const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM) }

  const submitCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.host_name) { toast.error('Name, phone and host are required'); return }
    setSubmitting(true)
    const res  = await fetch('/api/dashboard/visitors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), purpose: form.purpose, host_name: form.host_name.trim(), photo_url: form.photo_url || null }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) { toast.success(`${form.name} checked in`); closeModal(); load() }
    else toast.error(data.error ?? 'Check-in failed')
  }

  const skeletons = Array.from({ length: 6 })

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Visitors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setExportOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <FileDown size={15} /> Export
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
            <UserPlus size={15} /> <span className="hidden sm:inline">New </span>Check-in
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <div className="relative col-span-2 sm:flex-1 sm:min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>
        <select value={date} onChange={e => setDate(e.target.value)} className="px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {DATE_OPTS.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
        </select>
        <select value={purpose} onChange={e => setPurpose(e.target.value)} className="px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <option value="">All purposes</option>
          {PURPOSES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="col-span-2 sm:col-span-1 px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <option value="">All statuses</option>
          <option value="checked_in">Checked in</option>
          <option value="checked_out">Checked out</option>
        </select>
      </div>

      {/* ── Mobile card list ── */}
      <div className="sm:hidden space-y-3">
        {loading
          ? skeletons.map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)
          : rows.length === 0
            ? <div className="text-center py-12 text-sm text-gray-400">
                No visitors found.{' '}
                <button onClick={() => setModalOpen(true)} className="text-brand-500 hover:underline">Add one →</button>
              </div>
            : rows.map(row => (
                <VisitorCard
                  key={row.id}
                  row={row}
                  onCheckout={checkout}
                  checking={checkingOut === row.id}
                />
              ))
        }
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                {['Visitor', 'Purpose', 'Host', 'Date', 'In', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading
                ? skeletons.map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[1,2,3,4,5,6,7].map(j => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded" /></td>)}
                    </tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      No visitors found.{' '}
                      <button onClick={() => setModalOpen(true)} className="text-brand-500 hover:underline">Add one →</button>
                    </td></tr>
                  : rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {row.photo_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={row.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            : <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-600 flex-shrink-0">
                                {initials(row.visitor?.name ?? '?')}
                              </div>
                          }
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{row.visitor?.name ?? '—'}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{maskPhone(row.visitor?.phone ?? '')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{row.purpose}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-32">{row.host_name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTime(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.status === 'checked_in' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {row.status === 'checked_in' ? '● In' : 'Out'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.status === 'checked_in' ? (
                            <button onClick={() => checkout(row.id)} disabled={checkingOut === row.id}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                              <LogOut size={12} />{checkingOut === row.id ? 'Saving…' : 'Check out'}
                            </button>
                          ) : row.checked_out_at ? (
                            <span className="text-xs text-gray-400">{formatTime(row.checked_out_at)}</span>
                          ) : null}
                          <Link href={`/dashboard/visitors/${row.id}`}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-brand-500 hover:bg-brand-50 transition-colors" title="View details">
                            <ExternalLink size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* New Check-in Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="New Check-in">
        <form onSubmit={submitCheckin} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Field label="Full name" required>
            <input value={form.name} onChange={set('name')} placeholder="Ravi Kumar" className={INPUT} />
          </Field>
          <Field label="Mobile number" required>
            <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={INPUT} />
          </Field>
          <Field label="Purpose" required>
            <select value={form.purpose} onChange={set('purpose')} className={INPUT + ' bg-white'}>
              {PURPOSES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Host / meeting with" required>
            <input value={form.host_name} onChange={set('host_name')} placeholder="Gaurav Nimawat" className={INPUT} />
          </Field>
          <PhotoCaptureWidget label="Visitor photo (optional)" compact currentUrl={form.photo_url} onCapture={url => setForm(f => ({ ...f, photo_url: url }))} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50">
              {submitting ? 'Checking in…' : 'Check in'}
            </button>
          </div>
        </form>
      </Modal>

      <ExportPDFModal open={exportOpen} onClose={() => setExportOpen(false)} type="visitors" companyName={company} />
    </>
  )
}
