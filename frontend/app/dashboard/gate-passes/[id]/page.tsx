'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle,
  CheckCircle, Download, Printer, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { GatePassPdfData } from '@/lib/gatePdf'

interface GatePass {
  id: string
  pass_number: string
  pass_type: 'inward' | 'outward'
  vehicle_number: string
  vehicle_type: string | null
  driver_name: string | null
  driver_phone: string | null
  driver_license: string | null
  party_name: string
  party_phone: string | null
  party_address: string | null
  items: Array<{ name: string; quantity: number; unit: string; weight?: number }>
  total_weight: number | null
  weight_unit: string
  purpose: string | null
  po_number: string | null
  invoice_number: string | null
  remarks: string | null
  status: 'inside' | 'exited' | 'cancelled'
  checked_in_at: string
  checked_out_at: string | null
  vehicle_photo_url: string | null
  document_photo_url: string | null
  guard: { full_name: string | null } | null
  company: { name: string; logo_url: string | null } | null
}

const STATUS_PILL: Record<string, string> = {
  inside:    'bg-green-50 text-green-700 border-green-200',
  exited:    'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0 text-sm">
      <span className="w-36 flex-shrink-0 text-gray-400">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent}`}>{title}</p>
      {children}
    </div>
  )
}

export default function GatePassDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [gp,       setGp]       = useState<GatePass | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [exiting,  setExiting]  = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    fetch(`/api/gate-pass/${id}`)
      .then(r => r.json())
      .then(d => { setGp(d.gate_pass ?? null); setLoading(false) })
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
    } else {
      toast.error('Failed to update status')
    }
    setExiting(false)
  }

  const downloadPdf = async (autoPrint = false) => {
    if (!gp) return
    setPrinting(true)
    try {
      const { generateGatePassPDF } = await import('@/lib/gatePdf')
      const pdfData: GatePassPdfData = { ...gp, company_name: gp.company?.name }
      await generateGatePassPDF(pdfData, { autoPrint })
    } catch {
      toast.error('PDF generation failed')
    }
    setPrinting(false)
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-6 w-40 bg-gray-100 rounded" />
        <div className="h-28 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────
  if (!gp) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm mb-4">Gate pass not found.</p>
        <Link href="/dashboard/gate-passes" className="text-brand-500 text-sm hover:underline">
          ← Back to Gate Passes
        </Link>
      </div>
    )
  }

  const isInward  = gp.pass_type === 'inward'
  const accent    = isInward ? 'text-emerald-600' : 'text-amber-600'
  const accentBg  = isInward ? 'bg-emerald-50'   : 'bg-amber-50'

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/dashboard/gate-passes"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 leading-none">Gate Pass Detail</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{gp.pass_number}</p>
        </div>
      </div>

      {/* ── Header card ── */}
      <div className={`bg-white border rounded-xl p-5 mb-4 ${STATUS_PILL[gp.status] ?? STATUS_PILL.exited}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full ${accentBg} flex items-center justify-center flex-shrink-0`}>
              {isInward
                ? <ArrowDownCircle size={22} className={accent} />
                : <ArrowUpCircle   size={22} className={accent} />
              }
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xl font-mono">{gp.vehicle_number}</p>
              <p className={`text-xs font-mono font-semibold mt-0.5 ${accent}`}>
                {gp.pass_type.toUpperCase()} · {gp.pass_number}
              </p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full border font-semibold uppercase tracking-wide flex-shrink-0 ${STATUS_PILL[gp.status] ?? STATUS_PILL.exited}`}>
            {gp.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>In: {format(new Date(gp.checked_in_at), 'dd MMM yyyy, HH:mm')}</span>
          {gp.checked_out_at && (
            <span>Out: {format(new Date(gp.checked_out_at), 'dd MMM yyyy, HH:mm')}</span>
          )}
          {gp.guard?.full_name && <span>Guard: {gp.guard.full_name}</span>}
        </div>
      </div>

      <div className="space-y-3">
        {/* Vehicle & Driver */}
        <Section title="Vehicle & Driver" accent={accent}>
          <Row label="Vehicle No."  value={gp.vehicle_number} />
          <Row label="Vehicle Type" value={gp.vehicle_type}   />
          <Row label="Driver Name"  value={gp.driver_name}    />
          <Row label="Driver Phone" value={gp.driver_phone}   />
          <Row label="License No."  value={gp.driver_license} />
        </Section>

        {/* Party */}
        <Section title="Party / Vendor" accent={accent}>
          <Row label="Party Name"   value={gp.party_name}     />
          <Row label="Phone"        value={gp.party_phone}    />
          <Row label="Address"      value={gp.party_address}  />
          <Row label="Purpose"      value={gp.purpose}        />
          <Row label="PO Number"    value={gp.po_number}      />
          <Row label="Invoice No."  value={gp.invoice_number} />
        </Section>

        {/* Items */}
        <Section
          title={`Materials${gp.total_weight != null ? ` · ${gp.total_weight} ${gp.weight_unit} total` : ''}`}
          accent={accent}
        >
          {(gp.items ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No items recorded.</p>
          ) : (
            <div>
              {(gp.items ?? []).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
                  <span className="text-gray-900">{item.name}</span>
                  <span className="text-gray-400 text-xs">
                    {item.quantity} {item.unit}
                    {item.weight ? ` · ${item.weight} ${gp.weight_unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Remarks */}
        {gp.remarks && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Remarks</p>
            <p className="text-sm text-gray-700">{gp.remarks}</p>
          </div>
        )}

        {/* Photos */}
        {(gp.vehicle_photo_url || gp.document_photo_url) && (
          <div className="grid grid-cols-2 gap-3">
            {gp.vehicle_photo_url && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Vehicle photo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gp.vehicle_photo_url} alt="Vehicle" className="w-full rounded-xl object-cover aspect-video" />
              </div>
            )}
            {gp.document_photo_url && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Document photo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gp.document_photo_url} alt="Document" className="w-full rounded-xl object-cover aspect-video" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-5 flex-wrap">
        {gp.status === 'inside' && (
          <button
            onClick={markExited}
            disabled={exiting}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            {exiting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            Mark as Exited
          </button>
        )}
        <button
          onClick={() => downloadPdf(false)}
          disabled={printing}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          {printing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          Download PDF
        </button>
        <button
          onClick={() => downloadPdf(true)}
          disabled={printing}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          {printing ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          Print
        </button>
      </div>

      <Link
        href="/dashboard/gate-passes"
        className="mt-4 block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
      >
        ← Back to Gate Passes
      </Link>
    </div>
  )
}
