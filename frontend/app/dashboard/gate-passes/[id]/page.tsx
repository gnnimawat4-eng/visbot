'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle,
  CheckCircle, Download, Printer, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { GatePassPdfData } from '@/lib/gatePdf'
import { useCompanyBranding } from '@/hooks/useCompanyBranding'

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

const PRINT_CSS = `
  @page { size: A4 portrait; margin: 20mm; }
  @media print {
    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print  { display: none !important; }
    .scr-only  { display: none !important; }
    .prn-only  { display: block !important; }
    .prn-avoid { page-break-inside: avoid; }
  }
  .prn-only { display: none; }
`

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
  const { id }      = useParams<{ id: string }>()
  const [gp,        setGp]        = useState<GatePass | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [exiting,   setExiting]   = useState(false)
  const [pdfLoad,   setPdfLoad]   = useState(false)
  const branding = useCompanyBranding()

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

  // ── Loading ───────────────────────────────────────────────────
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

  const isInward = gp.pass_type === 'inward'
  const accent   = isInward ? 'text-emerald-600' : 'text-amber-600'
  const accentBg = isInward ? 'bg-emerald-50'   : 'bg-amber-50'
  const dt       = new Date(gp.checked_in_at)
  const dateStr  = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr  = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const infoFields: [string, string | null | undefined][] = [
    ['Vehicle No.',   gp.vehicle_number],
    ['Vehicle Type',  gp.vehicle_type],
    ['Driver',        gp.driver_name],
    ['Driver Phone',  gp.driver_phone],
    ['License',       gp.driver_license],
    ['Party',         gp.party_name],
    ['Party Phone',   gp.party_phone],
    ['Address',       gp.party_address],
    ['Purpose',       gp.purpose],
  ]

  return (
    <>
      <style>{PRINT_CSS}</style>

      {/* ══════════ Screen view ══════════════════════════════════════ */}
      <div className="scr-only max-w-2xl">

        {/* Top bar: back + title + action buttons */}
        <div className="no-print flex items-center gap-3 mb-5 flex-wrap">
          <Link
            href="/dashboard/gate-passes"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 leading-none">Gate Pass Detail</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{gp.pass_number}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {gp.status === 'inside' && (
              <button
                onClick={markExited}
                disabled={exiting}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {exiting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Mark Exited
              </button>
            )}
            <button
              onClick={downloadPdf}
              disabled={pdfLoad}
              className="flex items-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {pdfLoad ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>

        {/* Header card */}
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
      </div>

      {/* ══════════ Print-only A4 layout ═════════════════════════════ */}
      <div
        className="prn-only"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11pt', color: '#111', lineHeight: 1.45 }}
      >
        {/* Company header */}
        <div className="prn-avoid" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: '12px', borderBottom: '1.5px solid #222', marginBottom: '14px' }}>
          {branding?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {branding?.legal_name || branding?.name || gp.company?.name || ''}
            </p>
            {branding?.address_line1 && (
              <p style={{ margin: '3px 0 0', fontSize: '10pt', color: '#444' }}>{branding.address_line1}</p>
            )}
            {(branding?.city || branding?.state || branding?.pincode) && (
              <p style={{ margin: '2px 0 0', fontSize: '10pt', color: '#444' }}>
                {[branding?.city, branding?.state, branding?.pincode].filter(Boolean).join(', ')}
              </p>
            )}
            {(branding?.gst_number || branding?.cin_number) && (
              <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#555' }}>
                {[
                  branding?.gst_number && `GST: ${branding.gst_number}`,
                  branding?.cin_number && `CIN: ${branding.cin_number}`,
                ].filter(Boolean).join('   |   ')}
              </p>
            )}
            {(branding?.phone || branding?.email) && (
              <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#555' }}>
                {[branding?.phone, branding?.email].filter(Boolean).join('   ·   ')}
              </p>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="prn-avoid" style={{ textAlign: 'center', marginBottom: '14px' }}>
          <p style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>MATERIAL GATE PASS</p>
          <p style={{ fontSize: '10pt', margin: '4px 0 0', color: '#555', fontFamily: 'Courier New, monospace' }}>
            {gp.pass_number}
          </p>
          <div style={{ marginTop: '8px' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 14px',
              border: `1.5px solid ${isInward ? '#059669' : '#D97706'}`,
              borderRadius: '20px',
              fontSize: '10pt',
              fontWeight: 'bold',
              color: isInward ? '#059669' : '#D97706',
            }}>
              {gp.pass_type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Date / PO row */}
        <div className="prn-avoid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: '14px', fontSize: '10pt' }}>
          <div><span style={{ color: '#555' }}>Date:</span> <strong>{dateStr}</strong></div>
          <div><span style={{ color: '#555' }}>Time:</span> <strong>{timeStr}</strong></div>
          {gp.po_number      && <div><span style={{ color: '#555' }}>PO #:</span> <strong>{gp.po_number}</strong></div>}
          {gp.invoice_number && <div><span style={{ color: '#555' }}>Invoice #:</span> <strong>{gp.invoice_number}</strong></div>}
          {gp.status === 'exited' && gp.checked_out_at && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#555' }}>Exit:</span>{' '}
              <strong>
                {new Date(gp.checked_out_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' '}
                {new Date(gp.checked_out_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #DDD', margin: '10px 0 12px' }} />

        {/* Items table */}
        <div className="prn-avoid" style={{ marginBottom: '14px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '9.5pt', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px', color: '#333' }}>
            Items
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ background: '#1E1E1E', color: '#FFF' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Item</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', width: '55px' }}>Qty</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', width: '55px' }}>Unit</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', width: '75px' }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {(gp.items ?? []).map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FAFAFA' : '#FFF' }}>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #EEE' }}>{item.name}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #EEE' }}>{item.quantity}</td>
                  <td style={{ padding: '5px 8px', borderBottom: '1px solid #EEE' }}>{item.unit}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #EEE' }}>
                    {item.weight != null ? `${item.weight} ${gp.weight_unit}` : '—'}
                  </td>
                </tr>
              ))}
              {gp.total_weight != null && (
                <tr style={{ background: '#F0F0F0', fontWeight: 'bold' }}>
                  <td colSpan={2} style={{ padding: '5px 8px' }} />
                  <td style={{ padding: '5px 8px' }}>Total</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right' }}>{gp.total_weight} {gp.weight_unit}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #DDD', margin: '10px 0 12px' }} />

        {/* Carrier / vehicle info — 2 col grid */}
        <div className="prn-avoid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 24px', marginBottom: '14px', fontSize: '10pt' }}>
          {infoFields.filter(([, v]) => v).map(([label, val]) => (
            <div key={label}>
              <span style={{ color: '#555' }}>{label}:</span>{' '}
              <strong style={{ wordBreak: 'break-word' }}>{val}</strong>
            </div>
          ))}
        </div>

        {/* Remarks */}
        {gp.remarks && (
          <div className="prn-avoid" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', fontSize: '10pt' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 3px', color: '#92400E', fontSize: '9pt', textTransform: 'uppercase' }}>Remarks</p>
            <p style={{ margin: 0, color: '#333' }}>{gp.remarks}</p>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #DDD', margin: '10px 0 14px' }} />

        {/* Signature & Stamp — side-by-side rectangles */}
        <div className="prn-avoid" style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ width: '180px', height: '80px', border: '1px solid #D4D4D8', borderRadius: '6px', overflow: 'hidden', background: '#FAFAFA' }}>
              {branding?.signature_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.signature_url} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
            <div style={{ marginTop: '6px', fontSize: '9.5pt', color: '#222' }}>
              {branding?.authorized_signatory_name
                ? <p style={{ margin: 0, fontWeight: 'bold' }}>Name: {branding.authorized_signatory_name}</p>
                : <p style={{ margin: 0, color: '#888' }}>Authorized Signatory</p>
              }
              {branding?.authorized_signatory_designation && (
                <p style={{ margin: '2px 0 0', color: '#555' }}>Designation: {branding.authorized_signatory_designation}</p>
              )}
            </div>
          </div>

          <div>
            <div style={{ width: '180px', height: '80px', border: '1px solid #D4D4D8', borderRadius: '6px', overflow: 'hidden', background: '#FAFAFA' }}>
              {branding?.stamp_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.stamp_url} alt="Company Seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '9.5pt', color: '#555' }}>Company Seal</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '28px', borderTop: '1px solid #E5E5E5', paddingTop: '10px', textAlign: 'center', fontSize: '8pt', color: '#999' }}>
          <p style={{ margin: 0 }}>
            {branding?.footer_text || 'This is a system-generated document. Valid for one-time use only.'}
          </p>
          <p style={{ margin: '3px 0 0' }}>Generated by VisBot · visbot.app</p>
        </div>
      </div>
    </>
  )
}
