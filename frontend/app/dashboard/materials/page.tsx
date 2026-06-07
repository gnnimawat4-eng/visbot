'use client'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, CheckCircle, Plus, FileDown } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { Modal } from '@/components/dashboard/Modal'
import { ExportPDFModal } from '@/components/dashboard/ExportPDFModal'
import { PhotoCaptureWidget } from '@/components/ui/PhotoCaptureWidget'
import toast from 'react-hot-toast'

interface Material {
  id: string
  item_name: string
  quantity: number
  direction: 'in' | 'out'
  return_expected: boolean
  returned_at: string | null
  created_at: string
}

interface ActiveCheckin {
  id: string
  host_name: string
  visitor: { name: string; phone: string } | null
}

const EMPTY_FORM = {
  item_name:       '',
  quantity:        '1',
  direction:       'out' as 'in' | 'out',
  return_expected: true,
  checkin_id:      '',
  photo_url:       '',
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-full max-w-24" /></td>
      ))}
    </tr>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'

export default function MaterialsPage() {
  const [rows, setRows]               = useState<Material[]>([])
  const [loading, setLoading]         = useState(true)
  const [direction, setDirection]     = useState('')
  const [pendingOnly, setPendingOnly] = useState(false)
  const [marking, setMarking]         = useState<string | null>(null)
  const [company, setCompany]         = useState('VisBot Admin')

  const [modalOpen, setModalOpen]         = useState(false)
  const [exportOpen, setExportOpen]       = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [submitting, setSubmitting]       = useState(false)
  const [activeCheckins, setActiveCheckins] = useState<ActiveCheckin[]>([])

  useEffect(() => {
    fetch('/api/dashboard/company').then(r => r.ok ? r.json() : null).then(d => { if (d?.name) setCompany(d.name) }).catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (direction)   p.set('direction', direction)
    if (pendingOnly) p.set('pending', 'true')
    fetch(`/api/dashboard/materials?${p}`)
      .then(r => r.json())
      .then(d => { setRows(d.materials ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [direction, pendingOnly])

  useEffect(() => { load() }, [load])

  const openModal = () => {
    setModalOpen(true)
    fetch('/api/dashboard/checkins/active').then(r => r.json()).then(d => setActiveCheckins(d.checkins ?? [])).catch(() => {})
  }

  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM) }

  const markReturned = async (id: string) => {
    setMarking(id)
    const res = await fetch(`/api/dashboard/materials/${id}/return`, { method: 'PATCH' })
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, returned_at: new Date().toISOString() } : r))
      toast.success('Marked as returned')
    } else toast.error('Failed to update')
    setMarking(null)
  }

  const setField = <K extends keyof typeof EMPTY_FORM>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value as (typeof EMPTY_FORM)[K] }))

  const submitMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_name.trim()) { toast.error('Item name is required'); return }
    setSubmitting(true)
    const res  = await fetch('/api/dashboard/materials', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name:       form.item_name.trim(),
        quantity:        Number(form.quantity) || 1,
        direction:       form.direction,
        return_expected: form.direction === 'out' ? form.return_expected : false,
        checkin_id:      form.checkin_id || null,
        photo_url:       form.photo_url  || null,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) { toast.success('Material logged'); closeModal(); load() }
    else toast.error(data.error ?? 'Failed to log material')
  }

  const pending  = rows.filter(r => r.direction === 'out' && !r.returned_at && r.return_expected)
  const returned = rows.filter(r => r.returned_at)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Materials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{rows.length} log entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setExportOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FileDown size={15} /> Export
          </button>
          <button onClick={openModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
            <Plus size={15} /> <span className="hidden sm:inline">Log </span>Material
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total logged</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{rows.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/40 rounded-lg p-4">
            <p className="text-xs text-red-500 mb-1">Pending returns</p>
            <p className="text-2xl font-semibold text-red-600">{pending.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Returned</p>
            <p className="text-2xl font-semibold text-green-600">{returned.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select value={direction} onChange={e => setDirection(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <option value="">All directions</option>
          <option value="in">In</option>
          <option value="out">Out</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)} className="accent-brand-500 rounded" />
          Pending returns only
        </label>
      </div>

      {/* ── Mobile card list ── */}
      <div className="sm:hidden space-y-3 mb-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)
          : rows.length === 0
            ? <div className="text-center py-12 text-sm text-gray-400">No entries. <button onClick={openModal} className="text-brand-500 hover:underline">Log one →</button></div>
            : rows.map(row => {
                const isPending = row.direction === 'out' && row.return_expected && !row.returned_at
                return (
                  <div key={row.id} className={`bg-white dark:bg-gray-900 border rounded-lg p-4 ${isPending ? 'border-red-100 dark:border-red-900/40' : 'border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{row.item_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${row.direction === 'out' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
                        {row.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span>Qty: {row.quantity}</span>
                      <span>{formatDate(row.created_at)} {formatTime(row.created_at)}</span>
                    </div>
                    {row.returned_at
                      ? <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Returned {formatTime(row.returned_at)}</p>
                      : isPending
                        ? <button onClick={() => markReturned(row.id)} disabled={marking === row.id}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                            <CheckCircle size={14} />{marking === row.id ? 'Saving…' : 'Mark returned'}
                          </button>
                        : null
                    }
                  </div>
                )
              })
        }
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {['Item','Qty','Direction','Logged','Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
                : rows.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                      No material entries.{' '}
                      <button onClick={openModal} className="text-brand-500 hover:underline">Log one →</button>
                    </td></tr>
                  : rows.map(row => {
                    const isPending = row.direction === 'out' && !row.returned_at && row.return_expected
                    return (
                      <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isPending ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.item_name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.quantity}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.direction === 'out' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
                            {row.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.created_at)} {formatTime(row.created_at)}</td>
                        <td className="px-4 py-3">
                          {row.returned_at ? (
                            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Returned {formatTime(row.returned_at)}</span>
                          ) : row.return_expected && row.direction === 'out' ? (
                            <span className="text-xs text-red-500 font-medium">⚠ Pending return</span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {isPending && (
                            <button onClick={() => markReturned(row.id)} disabled={marking === row.id}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
                              <CheckCircle size={12} />{marking === row.id ? 'Saving…' : 'Mark returned'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Material Modal */}
      <Modal open={modalOpen} onClose={closeModal} title="Log Material">
        <form onSubmit={submitMaterial} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          <Field label="Item name *">
            <input value={form.item_name} onChange={setField('item_name')} placeholder="Laptop, ID card, Parcel…" className={INPUT} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input type="number" min="1" value={form.quantity} onChange={setField('quantity')} className={INPUT} />
            </Field>
            <Field label="Direction">
              <select value={form.direction} onChange={setField('direction')} className={INPUT + ' bg-white'}>
                <option value="out">OUT (leaving)</option>
                <option value="in">IN (arriving)</option>
              </select>
            </Field>
          </div>

          {form.direction === 'out' && (
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input type="checkbox" checked={form.return_expected}
                onChange={e => setForm(f => ({ ...f, return_expected: e.target.checked }))}
                className="accent-brand-500 w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Return expected</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Mark this item as pending until returned</p>
              </div>
            </label>
          )}

          <Field label="Link to visitor (optional)">
            <select value={form.checkin_id} onChange={setField('checkin_id')} className={INPUT + ' bg-white'}>
              <option value="">— No visitor linked —</option>
              {activeCheckins.map(c => (
                <option key={c.id} value={c.id}>{c.visitor?.name ?? 'Unknown'} → {c.host_name}</option>
              ))}
              {activeCheckins.length === 0 && <option disabled>No active check-ins today</option>}
            </select>
          </Field>

          {/* Proof photo */}
          <PhotoCaptureWidget
            label="Proof photo (optional)"
            compact
            currentUrl={form.photo_url}
            onCapture={url => setForm(f => ({ ...f, photo_url: url }))}
          />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving…' : 'Log material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PDF Export Modal */}
      <ExportPDFModal open={exportOpen} onClose={() => setExportOpen(false)} type="materials" companyName={company} />
    </>
  )
}
