// Client-side only — jsPDF uses browser canvas APIs
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
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W        = 210
  const H        = 297
  const margin   = 14
  const isInward = data.pass_type === 'inward'

  // Brand colours
  const accent: [number, number, number] = isInward ? [16, 150, 100] : [217, 119, 6]
  const lightBg: [number, number, number] = isInward ? [236, 253, 245] : [255, 251, 235]

  // ── Header strip ─────────────────────────────────────────
  doc.setFillColor(...accent)
  doc.rect(0, 0, W, 30, 'F')

  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company_name ?? 'VisBot', margin, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('GATE PASS', margin, 22)

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(data.pass_type.toUpperCase(), W - margin, 13, { align: 'right' })

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pass No: ${data.pass_number}`, W - margin, 21, { align: 'right' })

  // ── Date/PO row ──────────────────────────────────────────
  let y = 36
  const dt = new Date(data.checked_in_at)
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(`Date: ${dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin, y)
  doc.text(`Time: ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, margin + 50, y)
  if (data.po_number)      doc.text(`PO#: ${data.po_number}`, W - margin, y, { align: 'right' })
  if (data.invoice_number) doc.text(`Inv#: ${data.invoice_number}`, W - margin, y + 5, { align: 'right' })

  y += 9
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, W - margin, y)
  y += 6

  // ── Two-column boxes ─────────────────────────────────────
  const colW  = (W - margin * 2 - 6) / 2
  const col1x = margin
  const col2x = margin + colW + 6
  const boxH  = 48

  // Vehicle box
  doc.setFillColor(...lightBg)
  doc.roundedRect(col1x, y, colW, boxH, 2, 2, 'F')
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.4)
  doc.roundedRect(col1x, y, colW, boxH, 2, 2, 'S')

  doc.setFontSize(7.5)
  doc.setTextColor(...accent)
  doc.setFont('helvetica', 'bold')
  doc.text('VEHICLE & DRIVER', col1x + 3, y + 6)

  const vRows: [string, string][] = [
    ['Vehicle No.',  data.vehicle_number],
    ['Type',         data.vehicle_type ?? '—'],
    ['Driver Name',  data.driver_name  ?? '—'],
    ['Phone',        data.driver_phone ?? '—'],
    ['License',      data.driver_license ?? '—'],
  ]
  vRows.forEach(([label, val], i) => {
    const ry = y + 13 + i * 6.8
    doc.setTextColor(90, 90, 90)
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, col1x + 3, ry)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(val, col1x + 26, ry)
  })

  // Party box
  doc.setFillColor(...lightBg)
  doc.roundedRect(col2x, y, colW, boxH, 2, 2, 'F')
  doc.setDrawColor(...accent)
  doc.roundedRect(col2x, y, colW, boxH, 2, 2, 'S')

  doc.setFontSize(7.5)
  doc.setTextColor(...accent)
  doc.setFont('helvetica', 'bold')
  doc.text('PARTY / VENDOR', col2x + 3, y + 6)

  const pRows: [string, string][] = [
    ['Party Name',  data.party_name],
    ['Phone',       data.party_phone   ?? '—'],
    ['Address',     data.party_address ?? '—'],
    ['Purpose',     data.purpose       ?? '—'],
  ]
  pRows.forEach(([label, val], i) => {
    const ry = y + 13 + i * 6.8
    doc.setTextColor(90, 90, 90)
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, col2x + 3, ry)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    const wrapped = doc.splitTextToSize(val, colW - 26)
    doc.text(wrapped[0] ?? val, col2x + 22, ry)
  })

  y += boxH + 8

  // ── Items table ──────────────────────────────────────────
  doc.setFontSize(7.5)
  doc.setTextColor(...accent)
  doc.setFont('helvetica', 'bold')
  doc.text('MATERIAL DETAILS', margin, y)
  y += 2

  doc.setLineWidth(0.1)

  autoTable(doc, {
    startY:  y,
    margin:  { left: margin, right: margin },
    head: [['Sr.', 'Item Name', 'Quantity', 'Unit', 'Weight']],
    body: (data.items ?? []).map((item, i) => [
      i + 1,
      item.name,
      item.quantity,
      item.unit,
      item.weight != null ? `${item.weight} ${data.weight_unit}` : '—',
    ]),
    foot: [['', '', '', 'Total Weight', `${data.total_weight ?? '—'} ${data.weight_unit}`]],
    styles:          { fontSize: 8, cellPadding: 2.5 },
    headStyles:      { fillColor: accent, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    footStyles:      { fillColor: [245, 245, 245], fontStyle: 'bold', textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles:    { 0: { cellWidth: 10, halign: 'center' }, 2: { halign: 'right' }, 4: { halign: 'right' } },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  // ── Remarks ───────────────────────────────────────────────
  if (data.remarks) {
    doc.setFillColor(255, 252, 232)
    doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.text('Remarks:', margin + 3, y + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    const lines = doc.splitTextToSize(data.remarks, W - margin * 2 - 26)
    doc.text(lines, margin + 23, y + 5.5)
    y += 18
  }

  // ── QR + Signatures ───────────────────────────────────────
  const sigY = Math.max(y + 6, H - 62)

  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.3)
  doc.line(margin, sigY, W - margin, sigY)

  // QR placeholder box
  doc.setFillColor(248, 248, 248)
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, sigY + 4, 28, 28, 'FD')
  doc.setFontSize(6)
  doc.setTextColor(160, 160, 160)
  doc.text('VERIFY', margin + 14, sigY + 16, { align: 'center' })
  doc.setFontSize(5)
  doc.text(data.pass_number, margin + 14, sigY + 22, { align: 'center' })
  doc.text(data.id.slice(0, 8).toUpperCase(), margin + 14, sigY + 27, { align: 'center' })

  // Signature boxes
  const sigLabels = ['Guard / Security', 'Driver Signature', 'Manager / Authority']
  sigLabels.forEach((label, i) => {
    const bx = margin + 33 + i * 47
    doc.setDrawColor(180, 180, 180)
    doc.setFillColor(252, 252, 252)
    doc.rect(bx, sigY + 4, 43, 22, 'FD')
    doc.setFontSize(6.5)
    doc.setTextColor(120, 120, 120)
    doc.text(label, bx + 21.5, sigY + 32, { align: 'center' })
  })

  // Status stamp for exited passes
  if (data.status === 'exited' && data.checked_out_at) {
    const stDt = new Date(data.checked_out_at)
    doc.setTextColor(...accent)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(doc as any).setTextColor(...accent, 0.3)
    doc.text('EXITED', W / 2, H / 2, { align: 'center', angle: 45, renderingMode: 'fill' })
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Exited: ${stDt.toLocaleDateString('en-IN')} ${stDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      W / 2, sigY + 36, { align: 'center' },
    )
  }

  // ── Footer strip ──────────────────────────────────────────
  doc.setFillColor(...accent)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.pass_number} · Generated by VisBot`, W / 2, H - 3.5, { align: 'center' })

  if (opts.autoPrint) doc.autoPrint()
  doc.save(`GP-${data.pass_number}.pdf`)
}
