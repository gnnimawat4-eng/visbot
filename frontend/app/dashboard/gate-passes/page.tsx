'use client'
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Download, ExternalLink, Loader2, Search } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface GatePass {
  id: string
  pass_number: string
  pass_type: 'inward' | 'outward'
  vehicle_number: string
  vehicle_type: string | null
  party_name: string
  items: Array<{ name: string }>
  total_weight: number | null
  weight_unit: string
  status: 'inside' | 'exited' | 'cancelled'
  checked_in_at: string
  checked_out_at: string | null
}

const STATUS_STYLE: Record<string, string> = {
  inside:    'bg-green-50 text-green-700',
  exited:    'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
}

const today = () => new Date().toISOString().split('T')[0]

export default function GatePassesPage() {
  const [passes,    setPasses]    = useState<GatePass[]>([])
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)

  const [typeFilter,    setTypeFilter]    = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [dateFrom,      setDateFrom]      = useState(today())
  const [dateTo,        setDateTo]        = useState(today())
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [partySearch,   setPartySearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter)    params.set('type',      typeFilter)
    if (statusFilter)  params.set('status',    statusFilter)
    if (dateFrom)      params.set('date_from', dateFrom)
    if (dateTo)        params.set('date_to',   dateTo)
    if (vehicleSearch) params.set('vehicle',   vehicleSearch)
    if (partySearch)   params.set('party',     partySearch)

    const res  = await fetch(`/api/gate-pass?${params}`)
    const data = await res.json()
    setPasses(data.gate_passes ?? [])
    setLoading(false)
  }, [typeFilter, statusFilter, dateFrom, dateTo, vehicleSearch, partySearch])

  useEffect(() => { load() }, [load])

  const exportPdf = async () => {
    if (passes.length === 0) { toast.error('No passes to export'); return }
    setExporting(true)
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const accent: [number, number, number] = [29, 158, 117]

      doc.setFillColor(...accent)
      doc.rect(0, 0, 297, 20, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Gate Pass Report', 14, 13)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`${dateFrom} to ${dateTo}  |  ${passes.length} records`, 297 - 14, 13, { align: 'right' })

      autoTable(doc, {
        startY: 24,
        margin: { left: 14, right: 14 },
        head:   [['Pass #', 'Type', 'Vehicle', 'Party', 'Items', 'Weight', 'Status', 'In Time', 'Out Time']],
        body:   passes.map(p => [
          p.pass_number,
          p.pass_type.toUpperCase(),
          p.vehicle_number,
          p.party_name,
          p.items?.length ?? 0,
          p.total_weight != null ? `${p.total_weight} ${p.weight_unit}` : '—',
          p.status,
          format(new Date(p.checked_in_at), 'dd MMM HH:mm'),
          p.checked_out_at ? format(new Date(p.checked_out_at), 'dd MMM HH:mm') : '—',
        ]),
        styles:     { fontSize: 7.5, cellPadding: 2.5 },
        headStyles: { fillColor: accent, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      })

      doc.save(`GatePasses-${dateFrom}-to-${dateTo}.pdf`)
      toast.success('PDF exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const inward  = passes.filter(p => p.pass_type === 'inward').length
  const outward = passes.filter(p => p.pass_type === 'outward').length
  const inside  = passes.filter(p => p.status === 'inside').length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gate Passes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {inward} inward · {outward} outward · {inside} currently inside
          </p>
        </div>
        <button onClick={exportPdf} disabled={exporting}
          className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All types</option>
          <option value="inward">Inward</option>
          <option value="outward">Outward</option>
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All statuses</option>
          <option value="inside">Inside</option>
          <option value="exited">Exited</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />

        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} placeholder="Vehicle no."
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={partySearch} onChange={e => setPartySearch(e.target.value)} placeholder="Party name"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>
      </div>

      {/* ── Mobile card list ── */}
      <div className="sm:hidden space-y-3 mb-4">
        {loading
          ? [1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)
          : passes.length === 0
            ? <p className="text-center py-12 text-sm text-gray-400">No gate passes found.</p>
            : passes.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${p.pass_type === 'inward' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      {p.pass_type === 'inward' ? <ArrowDownCircle size={16} className="text-emerald-500" /> : <ArrowUpCircle size={16} className="text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{p.vehicle_number}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.pass_number} · {p.vehicle_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{p.party_name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{p.items?.length ?? 0} items{p.total_weight ? ` · ${p.total_weight} ${p.weight_unit}` : ''}</span>
                    <Link href={`/dashboard/gate-passes/${p.id}`} className="hover:underline flex items-center gap-1" style={{ color: 'var(--vb-accent)' }}>
                      View <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              ))
        }
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {['Pass #', 'Type', 'Vehicle', 'Party', 'Items', 'Weight', 'Status', 'In Time', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td>
                </tr>
              ))
            ) : passes.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">No gate passes found.</td></tr>
            ) : (
              passes.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{p.pass_number}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${p.pass_type === 'inward' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {p.pass_type === 'inward'
                        ? <ArrowDownCircle size={12} />
                        : <ArrowUpCircle   size={12} />
                      }
                      {p.pass_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-gray-100 text-xs">{p.vehicle_number}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[140px] truncate">{p.party_name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">{p.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {p.total_weight != null ? `${p.total_weight} ${p.weight_unit}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status] ?? STATUS_STYLE.exited}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(p.checked_in_at), 'dd MMM HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/gate-passes/${p.id}`}
                      className="inline-flex items-center gap-0.5 text-xs" style={{ color: 'var(--vb-accent)' }}>
                      View <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}
