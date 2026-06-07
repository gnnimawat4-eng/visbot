'use client'
import { useState } from 'react'
import { Modal } from './Modal'
import { Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type ReportType = 'visitors' | 'materials'

interface Props {
  open:        boolean
  onClose:     () => void
  type:        ReportType
  companyName: string
}

const today = () => format(new Date(), 'yyyy-MM-dd')
const monthStart = () => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'

export function ExportPDFModal({ open, onClose, type, companyName }: Props) {
  const [from, setFrom]       = useState(monthStart)
  const [to, setTo]           = useState(today)
  const [loading, setLoading] = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ from, to })
      const res    = await fetch(`/api/dashboard/${type}/export?${params}`)
      const json   = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Export failed'); return }

      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc       = new jsPDF({ orientation: 'landscape' })
      const dateLabel = `${format(new Date(from), 'dd/MM/yyyy')} – ${format(new Date(to), 'dd/MM/yyyy')}`
      const title     = type === 'visitors' ? 'Visitor Report' : 'Material Log Report'
      const generated = format(new Date(), 'dd/MM/yyyy HH:mm')

      // ── Header ─────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(29, 158, 117) // brand-500
      doc.text('VisBot', 14, 16)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(companyName, 14, 23)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(30, 30, 30)
      doc.text(title, 14, 32)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(`Date range: ${dateLabel}`, 14, 39)
      doc.text(`Generated: ${generated}`, 14, 44)

      // Divider
      doc.setDrawColor(29, 158, 117)
      doc.setLineWidth(0.5)
      doc.line(14, 48, doc.internal.pageSize.width - 14, 48)

      // ── Table ──────────────────────────────────────────────────
      if (type === 'visitors') {
        const rows = (json.checkins ?? []).map((c: Record<string, unknown>) => {
          const v = c.visitor as { name?: string; phone?: string } | null
          return [
            v?.name ?? '—',
            v?.phone ?? '—',
            String(c.purpose ?? '').replace(/^\w/, s => s.toUpperCase()),
            String(c.host_name ?? '—'),
            c.created_at     ? format(new Date(c.created_at as string),     'dd/MM/yy HH:mm') : '—',
            c.checked_out_at ? format(new Date(c.checked_out_at as string), 'dd/MM/yy HH:mm') : '—',
            c.status === 'checked_in' ? 'Checked In' : 'Checked Out',
          ]
        })
        autoTable(doc, {
          startY: 52,
          head:   [['Name', 'Phone', 'Purpose', 'Host', 'Check-in', 'Check-out', 'Status']],
          body:   rows,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [29, 158, 117], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 252, 249] },
          columnStyles: { 6: { halign: 'center' } },
        })
      } else {
        const rows = (json.materials ?? []).map((m: Record<string, unknown>) => {
          const checkin  = m.checkin as Record<string, unknown> | null
          const visitor  = checkin?.visitor as { name?: string } | null
          const returned = m.returned_at
          return [
            String(m.item_name ?? '—'),
            String(m.quantity ?? 1),
            String(m.direction ?? '').toUpperCase(),
            visitor?.name ?? '—',
            m.created_at ? format(new Date(m.created_at as string), 'dd/MM/yy HH:mm') : '—',
            returned ? `Returned ${format(new Date(returned as string), 'dd/MM/yy')}` :
              m.return_expected && m.direction === 'out' ? '⚠ Pending' : '—',
          ]
        })
        autoTable(doc, {
          startY: 52,
          head:   [['Item Name', 'Qty', 'Direction', 'Visitor', 'Date', 'Return Status']],
          body:   rows,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [29, 158, 117], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 252, 249] },
          columnStyles: { 2: { halign: 'center' }, 1: { halign: 'center' } },
        })
      }

      // Footer
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(160, 160, 160)
        doc.text(`Page ${i} of ${pageCount}  •  Generated by VisBot`, 14, doc.internal.pageSize.height - 8)
      }

      doc.save(`visbot-${type}-${from}-to-${to}.pdf`)
      toast.success('PDF downloaded')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={type === 'visitors' ? 'Export Visitor Report' : 'Export Material Log'}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a date range to include in the PDF.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">From</label>
            <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">To</label>
            <input type="date" value={to} min={from} max={today()} onChange={e => setTo(e.target.value)} className={INPUT} />
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
          PDF will include all records from <strong>{format(new Date(from), 'dd MMM yyyy')}</strong> to{' '}
          <strong>{format(new Date(to), 'dd MMM yyyy')}</strong> with VisBot header and company name.
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={download} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {loading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
