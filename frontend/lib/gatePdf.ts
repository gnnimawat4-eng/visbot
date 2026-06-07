// Gate pass PDF — uses window.print() with the GatePassDocument component HTML layout.
// The actual styled document is rendered by components/shared/GatePassDocument.tsx.
// Kept for backward compatibility; callers should prefer window.print() directly.

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
  _data: GatePassPdfData,
  _opts: { autoPrint?: boolean } = {},
): Promise<void> {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
