// Client-side only — jsPDF uses browser canvas APIs
import type { CompanyBranding } from './pdfBranding'

export interface GatePassItem {
  name: string
  quantity: number
  unit: string
  weight?: number
}

export interface GatePassPdfData {
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
  items: GatePassItem[]
  total_weight: number | null
  weight_unit: string
  purpose: string | null
  po_number: string | null
  invoice_number: string | null
  remarks: string | null
  checked_in_at: string
  checked_out_at?: string | null
  status: string
  company_name?: string
}

export async function generateGatePassPDF(
  data: GatePassPdfData,
  opts: { autoPrint?: boolean } = {},
): Promise<void> {
  const [
    { default: jsPDF },
    { default: autoTable },
    { fetchCompanyBranding, addBrandedHeader, addBrandedSignatureBlock, addBrandedFooter },
  ] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('./pdfBranding'),
  ])

  const rawBranding = await fetchCompanyBranding()
  const b: CompanyBranding = rawBranding ?? { name: data.company_name ?? 'VisBot' }

  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W        = 210
  const H        = 297
  const margin   = 16
  const isInward = data.pass_type === 'inward'

  // ── Watermark ──────────────────────────────────────────────
  doc.setFontSize(70)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(240, 240, 240)
  doc.text((b.legal_name || b.name).toUpperCase(), W / 2, H / 2, { align: 'center', angle: 330 })

  // ── Branded header ─────────────────────────────────────────
  let y = await addBrandedHeader(doc, b)

  // ── Document title ─────────────────────────────────────────
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('MATERIAL GATE PASS', W / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(data.pass_number, W / 2, y, { align: 'center' })
  y += 6

  // Direction pill
  const pillClr: [number, number, number] = isInward ? [5, 150, 105]  : [217, 119, 6]
  const pillBg:  [number, number, number] = isInward ? [236, 253, 245] : [255, 251, 235]
  doc.setFillColor(...pillBg)
  doc.setDrawColor(...pillClr)
  doc.setLineWidth(0.4)
  const pillW = 36
  doc.roundedRect((W - pillW) / 2, y, pillW, 7, 3.5, 3.5, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...pillClr)
  doc.text(data.pass_type.toUpperCase(), W / 2, y + 4.8, { align: 'center' })
  y += 13

  // ── Date / time / PO row ───────────────────────────────────
  const dt      = new Date(data.checked_in_at)
  const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(70, 70, 70)
  doc.text(`Date: ${dateStr}`, margin, y)
  doc.text(`Time: ${timeStr}`, W / 2, y)
  y += 6
  if (data.po_number)      { doc.text(`PO#: ${data.po_number}`,           margin, y); y += 6 }
  if (data.invoice_number) { doc.text(`Invoice#: ${data.invoice_number}`, margin, y); y += 6 }

  // Divider
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  doc.line(margin, y, W - margin, y)
  y += 6

  // ── Items table ────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text('ITEMS', margin, y)
  y += 3

  autoTable(doc, {
    startY:  y,
    margin:  { left: margin, right: margin },
    head: [['Item', 'Qty', 'Unit', 'Weight / Remarks']],
    body: (data.items ?? []).map(item => [
      item.name,
      item.quantity,
      item.unit,
      item.weight != null ? `${item.weight} ${data.weight_unit}` : '—',
    ]),
    foot: data.total_weight
      ? [['', '', 'Total Weight', `${data.total_weight} ${data.weight_unit}`]]
      : undefined,
    styles:             { fontSize: 9, cellPadding: 2.5 },
    headStyles:         { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    footStyles:         { fillColor: [245, 245, 245], fontStyle: 'bold', textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 25 },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  // ── Carrier / vehicle info ─────────────────────────────────
  const infoRows: [string, string][] = [
    ['Vehicle',      data.vehicle_number],
    ['Vehicle Type', data.vehicle_type   ?? ''],
    ['Carrier',      data.driver_name    ?? ''],
    ['Phone',        data.driver_phone   ?? ''],
    ['License',      data.driver_license ?? ''],
    ['Party',        data.party_name],
    ['Destination',  data.party_address  ?? ''],
    ['Purpose',      data.purpose        ?? ''],
  ].filter(([, v]) => v) as [string, string][]

  // Render in two columns
  const half = Math.ceil(infoRows.length / 2)
  const colW = (W - margin * 2) / 2 - 4

  infoRows.slice(0, half).forEach(([label, val], i) => {
    const rowY = y + i * 5.5
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(90, 90, 90)
    doc.text(`${label}:`, margin, rowY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 20, 20)
    const wrapped = doc.splitTextToSize(val, colW - 28)
    doc.text(wrapped[0] ?? val, margin + 28, rowY)
  })
  infoRows.slice(half).forEach(([label, val], i) => {
    const rowY = y + i * 5.5
    const cx   = W / 2 + 4
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(90, 90, 90)
    doc.text(`${label}:`, cx, rowY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 20, 20)
    const wrapped = doc.splitTextToSize(val, colW - 28)
    doc.text(wrapped[0] ?? val, cx + 28, rowY)
  })

  y += half * 5.5 + 4

  // Remarks
  if (data.remarks) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(110, 110, 110)
    const lines = doc.splitTextToSize(`Remarks: ${data.remarks}`, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 4.2
  }

  // Divider before signatures
  y += 5
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.2)
  doc.line(margin, y, W - margin, y)
  y += 6

  // ── Signature & stamp block ────────────────────────────────
  await addBrandedSignatureBlock(doc, b, y)

  // ── Status watermark for exited passes ─────────────────────
  if (data.status === 'exited' && data.checked_out_at) {
    const stDt  = new Date(data.checked_out_at)
    const stStr = `${stDt.toLocaleDateString('en-IN')} ${stDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(130, 130, 130)
    doc.text(`Exited: ${stStr}`, W / 2, H - 24, { align: 'center' })
  }

  // ── Branded footer ─────────────────────────────────────────
  addBrandedFooter(doc, b)

  if (opts.autoPrint) doc.autoPrint()
  doc.save(`GP-${data.pass_number}.pdf`)
}
