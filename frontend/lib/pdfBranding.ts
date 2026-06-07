// Client-side only — uses FileReader and jsPDF instance
import type { jsPDF } from 'jspdf'

export interface CompanyBranding {
  name: string
  legal_name?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  gst_number?: string | null
  cin_number?: string | null
  phone?: string | null
  email?: string | null
  logo_url?: string | null
  authorized_signatory_name?: string | null
  authorized_signatory_designation?: string | null
  signature_url?: string | null
  stamp_url?: string | null
  footer_text?: string | null
}

export async function fetchCompanyBranding(): Promise<CompanyBranding | null> {
  try {
    const res = await fetch('/api/dashboard/company')
    return res.ok ? res.json() : null
  } catch { return null }
}

async function urlToImgData(url: string): Promise<{ data: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const data = reader.result as string
        resolve({ data, format: blob.type.includes('png') ? 'PNG' : 'JPEG' })
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

/**
 * Draws logo + company name + address block.
 * Returns the Y position immediately below the divider line.
 */
export async function addBrandedHeader(doc: jsPDF, b: CompanyBranding): Promise<number> {
  const W      = doc.internal.pageSize.getWidth()
  const margin = 12
  let   y      = 10

  // Logo
  let logoEnd = margin
  if (b.logo_url) {
    const img = await urlToImgData(b.logo_url)
    if (img) {
      doc.addImage(img.data, img.format, margin, y - 2, 16, 16)
      logoEnd = margin + 20
    }
  }

  // Company legal name
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text(b.legal_name || b.name, logoEnd, y + 3)
  y += 8

  // Address lines
  const addrParts = [
    b.address_line1,
    b.address_line2,
    [b.city, b.state, b.pincode].filter(Boolean).join(', '),
  ].filter(Boolean) as string[]

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  addrParts.forEach(line => { doc.text(line, logoEnd, y); y += 4 })

  // GST / CIN row
  const regParts: string[] = []
  if (b.gst_number) regParts.push(`GST: ${b.gst_number}`)
  if (b.cin_number) regParts.push(`CIN: ${b.cin_number}`)
  if (regParts.length) {
    doc.setFontSize(7)
    doc.setTextColor(110, 110, 110)
    doc.text(regParts.join('   |   '), logoEnd, y)
    y += 4
  }

  // Contact row
  const contactParts: string[] = []
  if (b.phone) contactParts.push(b.phone)
  if (b.email) contactParts.push(b.email)
  if (contactParts.length) {
    doc.setFontSize(7)
    doc.setTextColor(110, 110, 110)
    doc.text(contactParts.join('   ·   '), logoEnd, y)
    y += 4
  }

  y += 2
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, y, W - margin, y)

  return y + 6
}

/**
 * Draws signature box + stamp circle + signatory name/designation.
 * Returns the Y position below the block.
 */
export async function addBrandedSignatureBlock(
  doc: jsPDF,
  b: CompanyBranding,
  startY: number,
): Promise<number> {
  const margin = 12
  let   y      = startY

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Authorized by:', margin, y)
  y += 4

  const sigW = 45
  const sigH = 22
  const gap  = 8
  const stpR = 14

  // Signature box
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(252, 252, 252)
  doc.rect(margin, y, sigW, sigH, 'FD')
  if (b.signature_url) {
    const img = await urlToImgData(b.signature_url)
    if (img) doc.addImage(img.data, img.format, margin + 2, y + 2, sigW - 4, sigH - 4)
  }

  // Stamp circle
  const stpX = margin + sigW + gap + stpR
  const stpY = y + stpR
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(252, 252, 252)
  doc.circle(stpX, stpY, stpR, 'FD')
  if (b.stamp_url) {
    const img = await urlToImgData(b.stamp_url)
    if (img) doc.addImage(img.data, img.format, stpX - stpR + 2, stpY - stpR + 2, stpR * 2 - 4, stpR * 2 - 4)
  }

  y += sigH + 3

  if (b.authorized_signatory_name) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text(b.authorized_signatory_name, margin, y)
    y += 4
  }
  if (b.authorized_signatory_designation) {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(b.authorized_signatory_designation, margin, y)
    y += 5
  }

  return y
}

/** Draws divider + footer text at the bottom of the page. */
export function addBrandedFooter(doc: jsPDF, b: CompanyBranding): void {
  const H      = doc.internal.pageSize.getHeight()
  const W      = doc.internal.pageSize.getWidth()
  const margin = 12

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, H - 14, W - margin, H - 14)

  const text = b.footer_text || 'This is a system-generated document. Valid for one-time use only.'
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(text,              W / 2, H - 9, { align: 'center' })
  doc.text('Generated by VisBot · visbot.app', W / 2, H - 5, { align: 'center' })
}
