'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowDownCircle, ArrowUpCircle, CheckCircle, Loader2, Printer } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { GatePassPdfData } from '@/lib/gatePdf'

interface GatePass {
  id: string; pass_number: string; pass_type: 'inward' | 'outward'
  vehicle_number: string; vehicle_type: string | null
  driver_name: string | null; driver_phone: string | null; driver_license: string | null
  party_name: string; party_phone: string | null; party_address: string | null
  items: Array<{ name: string; quantity: number; unit: string; weight?: number }>
  total_weight: number | null; weight_unit: string
  purpose: string | null; po_number: string | null; invoice_number: string | null
  remarks: string | null; status: 'inside' | 'exited' | 'cancelled'
  checked_in_at: string; checked_out_at: string | null
  vehicle_photo_url: string | null; document_photo_url: string | null
  guard: { full_name: string | null } | null
  company: { name: string; logo_url: string | null } | null
}

const STATUS: Record<string, string> = {
  inside:    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  exited:    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 dark:text-gray-500 w-32 flex-shrink-0">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
    </div>
  )
}

export default function GatePassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [gp,       setGp]       = useState<GatePass | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [exiting,  setExiting]  = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    fetch(`/api/gate-pass/${id}`)
      .then(r => r.json())
      .then(d => { setGp(d.gate_pass); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const markExited = async () => {
    if (!gp) return
    setExiting(true)
    const res = await fetch(`/api/gate-pass/${id}/exit`, { method: 'PATCH' })
    if (res.ok) {
      const data = await res.json()
      setGp(prev => prev ? { ...prev, ...data.gate_pass } : prev)
      toast.success('Marked as exited')
    } else toast.error('Failed')
    setExiting(false)
  }

  const printPdf = async () => {
    if (!gp) return
    setPrinting(true)
    try {
      const { generateGatePassPDF } = await import('@/lib/gatePdf')
      const pdfData: GatePassPdfData = { ...gp, company_name: gp.company?.name }
      await generateGatePassPDF(pdfData)
    } catch { toast.error('PDF failed') }
    setPrinting(false)
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
    </div>
  )

  if (!gp) return (
    <div className="text-center py-16">
      <p className="text-gray-400 dark:text-gray-500">Gate pass not found.</p>
      <button onClick={() => router.push('/guard/gate-pass')} className="mt-4 text-brand-500 text-sm hover:underline">← Back</button>
    </div>
  )

  const isInward = gp.pass_type === 'inward'
  const accent   = isInward ? 'text-emerald-600' : 'text-amber-600'
  const accentBg = isInward ? 'bg-emerald-50' : 'bg-amber-50'

  return (
    <>
      {/* Header card */}
      <div className={`bg-white dark:bg-gray-900 border rounded-lg p-5 mb-4 ${STATUS[gp.status]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${accentBg} flex items-center justify-center`}>
              {isInward ? <ArrowDownCircle size={20} className={accent} /> : <ArrowUpCircle size={20} className={accent} />}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg font-mono">{gp.vehicle_number}</p>
              <p className={`text-xs font-mono font-semibold ${accent}`}>{gp.pass_number}</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full border font-semibold uppercase tracking-wide ${STATUS[gp.status]}`}>
            {gp.status}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          <p>In: {format(new Date(gp.checked_in_at), 'dd MMM yyyy, HH:mm')}</p>
          {gp.checked_out_at && <p>Out: {format(new Date(gp.checked_out_at), 'dd MMM yyyy, HH:mm')}</p>}
          {gp.guard?.full_name && <p>Guard: {gp.guard.full_name}</p>}
        </div>
      </div>

      <div className="space-y-3">
        {/* Vehicle */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent}`}>Vehicle & Driver</p>
          <Row label="Vehicle No."  value={gp.vehicle_number}  />
          <Row label="Vehicle Type" value={gp.vehicle_type}    />
          <Row label="Driver Name"  value={gp.driver_name}     />
          <Row label="Driver Phone" value={gp.driver_phone}    />
          <Row label="License No."  value={gp.driver_license}  />
        </div>

        {/* Party */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent}`}>Party / Vendor</p>
          <Row label="Party Name"  value={gp.party_name}     />
          <Row label="Phone"       value={gp.party_phone}    />
          <Row label="Address"     value={gp.party_address}  />
          <Row label="Purpose"     value={gp.purpose}        />
          <Row label="PO Number"   value={gp.po_number}      />
          <Row label="Invoice No." value={gp.invoice_number} />
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent}`}>
            Materials{gp.total_weight != null ? ` · ${gp.total_weight} ${gp.weight_unit} total` : ''}
          </p>
          <div className="space-y-2">
            {(gp.items ?? []).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
                <span className="text-gray-400 dark:text-gray-500">{item.quantity} {item.unit}{item.weight ? ` · ${item.weight} ${gp.weight_unit}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks */}
        {gp.remarks && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Remarks</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{gp.remarks}</p>
          </div>
        )}

        {/* Photos */}
        {(gp.vehicle_photo_url || gp.document_photo_url) && (
          <div className="grid grid-cols-2 gap-3">
            {gp.vehicle_photo_url && <div>
              <p className="text-xs text-gray-400 mb-1">Vehicle</p>
              <img src={gp.vehicle_photo_url} alt="Vehicle" className="w-full rounded-xl object-cover aspect-video" />
            </div>}
            {gp.document_photo_url && <div>
              <p className="text-xs text-gray-400 mb-1">Document</p>
              <img src={gp.document_photo_url} alt="Document" className="w-full rounded-xl object-cover aspect-video" />
            </div>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        {gp.status === 'inside' && (
          <button onClick={markExited} disabled={exiting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors">
            {exiting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Mark Exited
          </button>
        )}
        <button onClick={printPdf} disabled={printing}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {printing ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
          Print
        </button>
      </div>

      <button onClick={() => router.push('/guard/gate-pass')}
        className="mt-4 w-full py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
        ← Back to Gate Passes
      </button>
    </>
  )
}
