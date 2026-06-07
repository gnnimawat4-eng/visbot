'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Download, Printer, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { GatePassPdfData } from '@/lib/gatePdf'
import { useCompanyBranding } from '@/hooks/useCompanyBranding'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Print CSS ────────────────────────────────────────────────────────────────

const PRINT_CSS = `
  @page { size: A4 portrait; margin: 15mm; }

  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; }
    .no-print { display: none !important; }
    .watermark {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
    }
  }

  .gp-wrapper { position: relative; overflow: hidden; }

  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 90px;
    font-weight: 900;
    color: #000;
    opacity: 0.04;
    white-space: nowrap;
    z-index: 0;
    pointer-events: none;
    text-transform: uppercase;
    font-family: Arial, Helvetica, sans-serif;
    user-select: none;
  }

  .gp-table { border-collapse: collapse; width: 100%; }
  .gp-table th, .gp-table td { border: 1px solid #000; padding: 8px; }
  .gp-table thead tr { background: #000 !important; color: #fff !important; }
`

// ─── Helper components ────────────────────────────────────────────────────────

function LabelVal({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="font-semibold text-gray-700 text-xs">{label}</span>
      <span
        className="border-b border-dotted border-gray-400 pb-0.5 min-h-[20px]"
        style={{ minWidth: '120px' }}
      >
        {value || ''}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GatePassDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const branding  = useCompanyBranding()

  const [gp,       setGp]       = useState<GatePass | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [exiting,  setExiting]  = useState(false)
  const [pdfLoad,  setPdfLoad]  = useState(false)

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

  const downloadPdf = async () => {
    if (!gp) return
    setPdfLoad(true)
    try {
      const { generateGatePassPDF } = await import('@/lib/gatePdf')
      const pdfData: GatePassPdfData = { ...gp, company_name: gp.company?.name }
      await generateGatePassPDF(pdfData)
    } catch {
      toast.error('PDF generation failed')
    }
    setPdfLoad(false)
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-32 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────────────────
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

  // ── Derived values ────────────────────────────────────────────────────────
  const dt       = new Date(gp.checked_in_at)
  const dateStr  = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr  = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const companyName = branding?.legal_name || branding?.name || gp.company?.name || ''
  const addressLine = [
    branding?.address_line1,
    branding?.address_line2,
    branding?.city,
    branding?.state,
    branding?.pincode,
  ].filter(Boolean).join(', ')
  const contactLine = [
    branding?.gst_number && `GST: ${branding.gst_number}`,
    branding?.phone      && `Phone: ${branding.phone}`,
    branding?.email      && `Email: ${branding.email}`,
  ].filter(Boolean).join('   |   ')

  // Pad to minimum 5 item rows so the table always looks like a proper form
  const MIN_ROWS = 5
  const itemRows = [...(gp.items ?? [])]
  while (itemRows.length < MIN_ROWS) {
    itemRows.push({ name: '', quantity: 0, unit: '', weight: undefined })
  }

  return (
    <>
      <style>{PRINT_CSS}</style>

      {/* ── Action buttons (hidden in print) ───────────────────────────────── */}
      <div className="no-print flex items-center justify-between mb-5">
        <Link
          href="/dashboard/gate-passes"
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-2">
          {gp.status === 'inside' && (
            <button
              onClick={markExited}
              disabled={exiting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {exiting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Mark Exited
            </button>
          )}
          <button
            onClick={downloadPdf}
            disabled={pdfLoad}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            {pdfLoad ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* ── Gate pass document ─────────────────────────────────────────────── */}
      <div className="gp-wrapper max-w-[780px] mx-auto bg-white">

        {/* Watermark */}
        <div className="watermark" aria-hidden>
          {companyName.toUpperCase() || 'VISBOT'}
        </div>

        {/* Document content sits above watermark */}
        <div className="relative" style={{ zIndex: 1 }}>

          {/* ── SECTION 1: Company header ───────────────────────────────────── */}
          <div className="border-2 border-black p-4">
            <div className="grid items-start" style={{ gridTemplateColumns: '20% 60% 20%' }}>
              {/* Logo */}
              <div className="flex items-center justify-center">
                {branding?.logo_url
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={branding.logo_url}
                      alt={companyName}
                      style={{ width: 80, height: 80, objectFit: 'contain' }}
                    />
                  )
                  : (
                    <div
                      className="flex items-center justify-center text-white font-bold text-2xl rounded"
                      style={{ width: 80, height: 80, background: '#10B981', flexShrink: 0 }}
                    >
                      {companyName.charAt(0).toUpperCase() || 'V'}
                    </div>
                  )
                }
              </div>

              {/* Company details — center column */}
              <div className="text-center px-2">
                <p className="font-bold text-lg uppercase leading-tight">{companyName}</p>
                {addressLine  && <p className="text-sm text-gray-700 mt-1 leading-snug">{addressLine}</p>}
                {contactLine  && <p className="text-xs text-gray-600 mt-1">{contactLine}</p>}
                {branding?.cin_number && (
                  <p className="text-xs text-gray-500 mt-0.5">CIN: {branding.cin_number}</p>
                )}
              </div>

              {/* Right — intentionally empty */}
              <div />
            </div>
          </div>

          {/* ── SECTION 2: Title bar ────────────────────────────────────────── */}
          <div
            className="text-center font-bold text-xl py-3 uppercase tracking-widest"
            style={{ background: '#000', color: '#fff' }}
          >
            Material Gate Pass
          </div>

          {/* ── SECTION 3: Meta info ────────────────────────────────────────── */}
          <div className="border border-t-0 border-black p-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold w-28 flex-shrink-0">Pass No.</span>
                <span className="font-mono">{gp.pass_number}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-28 flex-shrink-0">Direction</span>
                <span className="font-bold uppercase">{gp.pass_type}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-28 flex-shrink-0">Date</span>
                <span>{dateStr}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-28 flex-shrink-0">PO Number</span>
                <span>{gp.po_number || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-28 flex-shrink-0">Time</span>
                <span>{timeStr}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-28 flex-shrink-0">Invoice No.</span>
                <span>{gp.invoice_number || '—'}</span>
              </div>
              {gp.status === 'exited' && gp.checked_out_at && (
                <div className="flex gap-2 col-span-2">
                  <span className="font-semibold w-28 flex-shrink-0">Exit Time</span>
                  <span>
                    {new Date(gp.checked_out_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' '}
                    {new Date(gp.checked_out_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 4: Items table ──────────────────────────────────────── */}
          <table className="gp-table border-2 border-black border-t-0">
            <thead>
              <tr>
                <th className="text-center w-8">#</th>
                <th className="text-left" style={{ minWidth: '200px' }}>Item Description</th>
                <th className="text-center w-16">Qty</th>
                <th className="text-center w-16">Unit</th>
                <th className="text-center w-20">Weight</th>
                <th className="text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((item, i) => (
                <tr key={i} style={{ minHeight: '32px', height: '32px' }}>
                  <td className="text-center text-sm">
                    {item.name ? i + 1 : ' '}
                  </td>
                  <td className="text-sm">{item.name || ' '}</td>
                  <td className="text-center text-sm">
                    {item.name ? item.quantity : ' '}
                  </td>
                  <td className="text-center text-sm">
                    {item.name ? item.unit : ' '}
                  </td>
                  <td className="text-center text-sm">
                    {item.name && item.weight != null ? `${item.weight} ${gp.weight_unit}` : ' '}
                  </td>
                  <td className="text-sm">{' '}</td>
                </tr>
              ))}
              {/* Total row */}
              {gp.total_weight != null && (
                <tr style={{ background: '#F5F5F5' }}>
                  <td colSpan={4} className="text-right font-semibold text-sm pr-2">Total Weight</td>
                  <td className="text-center font-semibold text-sm">{gp.total_weight} {gp.weight_unit}</td>
                  <td>{' '}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── SECTION 5: Party & transport ────────────────────────────────── */}
          <div className="border border-t-0 border-black p-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {/* Left: party */}
              <div className="space-y-3">
                <LabelVal label="Party / Vendor Name"   value={gp.party_name}    />
                <LabelVal label="Destination / Source"  value={gp.party_address} />
                <LabelVal label="Purpose"               value={gp.purpose}       />
              </div>
              {/* Right: transport */}
              <div className="space-y-3">
                <LabelVal label="Carrier Name"          value={gp.driver_name}    />
                <LabelVal label="Carrier Phone"         value={gp.driver_phone}   />
                <LabelVal label="Vehicle No."           value={gp.vehicle_number} />
                <LabelVal label="Vehicle Type"          value={gp.vehicle_type}   />
                <LabelVal label="License No."           value={gp.driver_license} />
              </div>
            </div>
          </div>

          {/* ── SECTION 6: Remarks ──────────────────────────────────────────── */}
          <div className="border border-t-0 border-black p-3">
            <p className="font-semibold text-sm mb-1">Remarks:</p>
            <p className="text-sm" style={{ minHeight: '36px' }}>{gp.remarks || ''}</p>
          </div>

          {/* ── SECTION 7: Signatures ───────────────────────────────────────── */}
          <div className="border border-t-0 border-black grid grid-cols-3 divide-x divide-black">
            {/* Prepared by */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Prepared by</p>
              <div
                className="border border-dashed border-gray-300 flex items-center justify-center"
                style={{ height: 80 }}
              />
              {gp.guard?.full_name && (
                <p className="text-xs font-semibold mt-2">{gp.guard.full_name}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Guard / Operator</p>
            </div>

            {/* Authorized Signatory */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Authorized Signatory</p>
              <div
                className="border border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                style={{ height: 80 }}
              >
                {branding?.signature_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.signature_url}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              {branding?.authorized_signatory_name && (
                <p className="text-xs font-semibold mt-2">{branding.authorized_signatory_name}</p>
              )}
              {branding?.authorized_signatory_designation && (
                <p className="text-xs text-gray-500 mt-0.5">{branding.authorized_signatory_designation}</p>
              )}
            </div>

            {/* Receiver / Stamp */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Receiver&apos;s Signature</p>
              <div
                className="border border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                style={{ height: 80 }}
              >
                {branding?.stamp_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.stamp_url}
                    alt="Company Seal"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Company Seal</p>
            </div>
          </div>

          {/* ── SECTION 8: Footer ───────────────────────────────────────────── */}
          <div className="border border-t-0 border-black p-3 text-center">
            <p className="text-xs text-gray-500">
              {branding?.footer_text || 'This is a system-generated document. Subject to terms and conditions.'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Generated by VisBot · visbot.app</p>
          </div>

        </div>{/* /relative z-1 */}
      </div>{/* /gp-wrapper */}
    </>
  )
}
