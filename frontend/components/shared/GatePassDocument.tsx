'use client'
import type { CompanyBranding } from '@/lib/pdfBranding'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatePassData {
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
  status: string
  checked_in_at: string
  checked_out_at: string | null
  guard: { full_name: string | null } | null
  company: { name: string; logo_url: string | null } | null
}

// ─── Print CSS (injected once by the component) ───────────────────────────────

const PRINT_CSS = `
  @page { size: A4 portrait; margin: 15mm; }

  @media print {
    /* ── Isolation: only .print-content and its descendants are visible ── */
    body * { visibility: hidden; }
    .print-content, .print-content * { visibility: visible; }
    .print-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      overflow: visible; /* allow content to flow across pages */
    }

    /* ── Hard-hide UI chrome (display:none beats visibility for fixed elements) ── */
    .no-print,
    nav, header, aside {
      display: none !important;
      visibility: hidden !important;
    }

    /* ── Document wrapper must not clip multi-page content ── */
    .gp-wrapper {
      overflow: visible !important;
      max-width: none !important;
    }

    /* ── Color printing ── */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; }

    /* ── Watermark stays centered on every page ── */
    .watermark {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
    }

    /* ── Page break rules ── */
    .gate-pass-header,
    .gate-pass-title,
    .gate-pass-meta {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .signatures-section,
    .footer-section {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-before: auto;
      break-before: auto;
    }

    /* Allow table to break across pages, but keep each row intact */
    table {
      page-break-inside: auto;
      break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: auto;
      break-after: auto;
    }

    /* Repeat table header on every printed page */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
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

const MIN_ROWS = 5

// ─── Helper ───────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  gp: GatePassData
  branding: CompanyBranding | null
}

export function GatePassDocument({ gp, branding }: Props) {
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

  const dt      = new Date(gp.checked_in_at)
  const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const itemRows = [...(gp.items ?? [])]
  while (itemRows.length < MIN_ROWS) {
    itemRows.push({ name: '', quantity: 0, unit: '', weight: undefined })
  }

  return (
    <>
      <style>{PRINT_CSS}</style>

      <div className="gp-wrapper print-content max-w-[780px] mx-auto bg-white">
        {/* Watermark */}
        <div className="watermark" aria-hidden>
          {companyName.toUpperCase() || 'VISBOT'}
        </div>

        {/* Document content — sits above watermark */}
        <div className="relative" style={{ zIndex: 1 }}>

          {/* ── S1: Company header ─────────────────────────────────────────── */}
          <div className="gate-pass-header border-2 border-black p-4">
            <div className="grid items-start" style={{ gridTemplateColumns: '20% 60% 20%' }}>
              {/* Logo */}
              <div className="flex items-center justify-center">
                {branding?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.logo_url}
                    alt={companyName}
                    style={{ width: 80, height: 80, objectFit: 'contain' }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-white font-bold text-2xl rounded"
                    style={{ width: 80, height: 80, background: '#10B981', flexShrink: 0 }}
                  >
                    {companyName.charAt(0).toUpperCase() || 'V'}
                  </div>
                )}
              </div>

              {/* Company details */}
              <div className="text-center px-2">
                <p className="font-bold text-lg uppercase leading-tight">{companyName}</p>
                {addressLine  && <p className="text-sm text-gray-700 mt-1 leading-snug">{addressLine}</p>}
                {contactLine  && <p className="text-xs text-gray-600 mt-1">{contactLine}</p>}
                {branding?.cin_number && (
                  <p className="text-xs text-gray-500 mt-0.5">CIN: {branding.cin_number}</p>
                )}
              </div>

              {/* Right — empty */}
              <div />
            </div>
          </div>

          {/* ── S2: Title bar ──────────────────────────────────────────────── */}
          <div
            className="gate-pass-title text-center font-bold text-xl py-3 uppercase tracking-widest"
            style={{ background: '#000', color: '#fff' }}
          >
            Material Gate Pass
          </div>

          {/* ── S3: Meta info ──────────────────────────────────────────────── */}
          <div className="gate-pass-meta border border-t-0 border-black p-3">
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

          {/* ── S4: Items table ────────────────────────────────────────────── */}
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
                  <td className="text-center text-sm">{item.name ? i + 1 : ' '}</td>
                  <td className="text-sm">{item.name || ' '}</td>
                  <td className="text-center text-sm">{item.name ? item.quantity : ' '}</td>
                  <td className="text-center text-sm">{item.name ? item.unit : ' '}</td>
                  <td className="text-center text-sm">
                    {item.name && item.weight != null ? `${item.weight} ${gp.weight_unit}` : ' '}
                  </td>
                  <td className="text-sm">{' '}</td>
                </tr>
              ))}
              {gp.total_weight != null && (
                <tr style={{ background: '#F5F5F5' }}>
                  <td colSpan={4} className="text-right font-semibold text-sm pr-2">Total Weight</td>
                  <td className="text-center font-semibold text-sm">{gp.total_weight} {gp.weight_unit}</td>
                  <td>{' '}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── S5: Party & transport ──────────────────────────────────────── */}
          <div className="border border-t-0 border-black p-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-3">
                <LabelVal label="Party / Vendor Name"  value={gp.party_name}    />
                <LabelVal label="Destination / Source" value={gp.party_address} />
                <LabelVal label="Purpose"              value={gp.purpose}       />
              </div>
              <div className="space-y-3">
                <LabelVal label="Carrier Name"  value={gp.driver_name}    />
                <LabelVal label="Carrier Phone" value={gp.driver_phone}   />
                <LabelVal label="Vehicle No."   value={gp.vehicle_number} />
                <LabelVal label="Vehicle Type"  value={gp.vehicle_type}   />
                <LabelVal label="License No."   value={gp.driver_license} />
              </div>
            </div>
          </div>

          {/* ── S6: Remarks ────────────────────────────────────────────────── */}
          <div className="border border-t-0 border-black p-3">
            <p className="font-semibold text-sm mb-1">Remarks:</p>
            <p className="text-sm" style={{ minHeight: '36px' }}>{gp.remarks || ''}</p>
          </div>

          {/* ── S7: Signatures ─────────────────────────────────────────────── */}
          <div className="signatures-section border border-t-0 border-black grid grid-cols-3 divide-x divide-black">
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

          {/* ── S8: Footer ─────────────────────────────────────────────────── */}
          <div className="footer-section border border-t-0 border-black p-3 text-center">
            <p className="text-xs text-gray-500">
              {branding?.footer_text || 'This is a system-generated document. Subject to terms and conditions.'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Generated by VisBot · visbot.app</p>
          </div>

        </div>{/* /relative */}
      </div>{/* /gp-wrapper */}
    </>
  )
}
