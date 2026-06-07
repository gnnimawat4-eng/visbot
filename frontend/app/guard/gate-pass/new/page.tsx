'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Printer, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PhotoCaptureWidget } from '@/components/ui/PhotoCaptureWidget'
import { VendorAutocomplete } from '@/components/ui/VendorAutocomplete'
import type { GatePassPdfData } from '@/lib/gatePdf'

const VEHICLE_TYPES = ['truck', 'tempo', 'car', 'bike', 'other'] as const
const UNITS         = ['kg', 'litre', 'piece', 'box', 'metre', 'tonne'] as const

const INPUT  = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500'
const LABEL  = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

interface ItemRow { id: number; name: string; qty: string; unit: string; weight: string }
let _id = 1
const newItem = (): ItemRow => ({ id: _id++, name: '', qty: '1', unit: 'piece', weight: '' })

function NewGatePassPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const defaultType  = (searchParams.get('type') ?? 'inward') as 'inward' | 'outward'

  const [wizardStep, setWizardStep] = useState(1)
  const [done,       setDone]       = useState(false)
  const [createdPass, setCreatedPass] = useState<GatePassPdfData | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [company,     setCompany]     = useState('')

  // Step 1
  const [passType,      setPassType]      = useState<'inward' | 'outward'>(defaultType)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [vehicleType,   setVehicleType]   = useState('truck')
  const [driverName,    setDriverName]    = useState('')
  const [driverPhone,   setDriverPhone]   = useState('')
  const [driverLicense, setDriverLicense] = useState('')

  // Step 2
  const [partyName,     setPartyName]     = useState('')
  const [partyPhone,    setPartyPhone]    = useState('')
  const [partyAddress,  setPartyAddress]  = useState('')
  const [vendorId,      setVendorId]      = useState<string | null>(null)
  const [poNumber,      setPoNumber]      = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [purpose,       setPurpose]       = useState('')
  const [items,         setItems]         = useState<ItemRow[]>([newItem()])

  // Step 3
  const [vehiclePhotoUrl,  setVehiclePhotoUrl]  = useState('')
  const [documentPhotoUrl, setDocumentPhotoUrl] = useState('')
  const [remarks,          setRemarks]          = useState('')

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.company?.name) setCompany(d.company.name) }).catch(() => {})
  }, [])

  const totalWeight = items.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0)
  const addItem    = () => setItems(p => [...p, newItem()])
  const removeItem = (id: number) => setItems(p => p.length > 1 ? p.filter(r => r.id !== id) : p)
  const updateItem = (id: number, f: keyof Omit<ItemRow,'id'>, v: string) =>
    setItems(p => p.map(r => r.id === id ? { ...r, [f]: v } : r))

  const next = () => {
    if (wizardStep === 1 && !vehicleNumber.trim()) { toast.error('Vehicle number is required'); return }
    if (wizardStep === 2 && !partyName.trim())     { toast.error('Party name is required'); return }
    if (wizardStep === 2 && items.some(r => !r.name.trim())) { toast.error('All items need a name'); return }
    setWizardStep(s => Math.min(s + 1, 3))
    window.scrollTo(0, 0)
  }
  const back = () => { setWizardStep(s => Math.max(s - 1, 1)); window.scrollTo(0, 0) }

  const submit = async () => {
    setSubmitting(true)
    try {
      const res  = await fetch('/api/gate-pass', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pass_type: passType,
          vehicle_number: vehicleNumber.toUpperCase(),
          vehicle_type: vehicleType,
          driver_name: driverName || null, driver_phone: driverPhone || null, driver_license: driverLicense || null,
          party_name: partyName, party_phone: partyPhone || null, party_address: partyAddress || null,
          po_number: poNumber || null, invoice_number: invoiceNumber || null, purpose: purpose || null,
          items: items.map(r => ({ name: r.name.trim(), quantity: parseFloat(r.qty)||1, unit: r.unit, weight: parseFloat(r.weight)||undefined })),
          total_weight: totalWeight > 0 ? totalWeight : null, weight_unit: 'kg',
          vehicle_photo_url: vehiclePhotoUrl || null,
          document_photo_url: documentPhotoUrl || null,
          remarks: remarks || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
      const gp: GatePassPdfData = { ...data.gate_pass, company_name: company }
      setCreatedPass(gp); setDone(true)
      try { const { generateGatePassPDF } = await import('@/lib/gatePdf'); await generateGatePassPDF(gp) } catch { /* non-blocking */ }
    } finally { setSubmitting(false) }
  }

  const isInward = passType === 'inward'
  const accentBtn = isInward ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'

  if (done && createdPass) {
    return (
      <div className="text-center py-16 space-y-5">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gate Pass Created!</h2>
          <p className={`font-mono font-bold mt-1 ${isInward ? 'text-emerald-600' : 'text-amber-600'}`}>{createdPass.pass_number}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{createdPass.vehicle_number} · {createdPass.party_name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">PDF downloaded automatically.</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={async () => { const { generateGatePassPDF } = await import('@/lib/gatePdf'); await generateGatePassPDF(createdPass) }}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            <Printer size={14} /> Re-print
          </button>
          <button onClick={() => router.push(`/guard/gate-pass/${createdPass.id}`)}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm hover:bg-brand-600 transition-colors">
            View Details
          </button>
          <button onClick={() => router.push('/guard/gate-pass')}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            Hub
          </button>
        </div>
      </div>
    )
  }

  // ── Step progress ──────────────────────────────────────────────
  const STEPS = ['Vehicle', 'Party & Items', 'Confirm']

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            isInward ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>{passType}</span>
          <span className="text-gray-400 text-xs">Step {wizardStep} of 3</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {wizardStep === 1 ? 'Vehicle Details' : wizardStep === 2 ? 'Party & Materials' : 'Photos & Confirm'}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const n = i + 1
          const current = wizardStep === n
          const done2   = wizardStep > n
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                done2    ? 'bg-brand-500 text-white'
                : current ? (isInward ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white')
                :           'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
              ].join(' ')}>{done2 ? '✓' : n}</div>
              <span className={`text-xs hidden sm:inline ${current ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done2 ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1: Vehicle ── */}
      {wizardStep === 1 && (
        <div className="space-y-5">
          <div>
            <label className={LABEL}>Pass type *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['inward','outward'] as const).map(t => (
                <button key={t} type="button" onClick={() => setPassType(t)}
                  className={`py-3.5 rounded-xl font-semibold text-sm transition-all border ${
                    passType === t
                      ? t === 'inward'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                  {t === 'inward' ? '↓ INWARD' : '↑ OUTWARD'}
                  <div className="text-xs font-normal opacity-75 mt-0.5">{t === 'inward' ? 'Vehicle entering' : 'Vehicle leaving'}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Vehicle number *</label>
            <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="MH-04-AB-1234" className={INPUT + ' font-mono uppercase tracking-wider'} />
          </div>
          <div>
            <label className={LABEL}>Vehicle type</label>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className={INPUT + ' bg-white'}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Driver name</label>
              <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Ramesh Singh" className={INPUT} /></div>
            <div><label className={LABEL}>Driver phone</label>
              <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="+91…" className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>License number</label>
            <input value={driverLicense} onChange={e => setDriverLicense(e.target.value)} placeholder="DL-1420110012345" className={INPUT} /></div>
          <NavButtons wizardStep={wizardStep} onNext={next} onBack={back} accentBtn={accentBtn} />
        </div>
      )}

      {/* ── STEP 2: Party + Items ── */}
      {wizardStep === 2 && (
        <div className="space-y-5">
          <div><label className={LABEL}>Vendor / Party name *</label>
            <VendorAutocomplete value={partyName} vendorId={vendorId}
              onChange={(name, v) => { setPartyName(name); setVendorId(v?.id ?? null); if (v?.phone) setPartyPhone(v.phone) }}
              placeholder="Search vendor or type party name…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Phone</label>
              <input value={partyPhone} onChange={e => setPartyPhone(e.target.value)} placeholder="+91…" className={INPUT} /></div>
            <div><label className={LABEL}>Purpose</label>
              <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Delivery" className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>Address</label>
            <input value={partyAddress} onChange={e => setPartyAddress(e.target.value)} placeholder="123, Industrial Area" className={INPUT} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>PO Number</label>
              <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="PO-2025-001" className={INPUT} /></div>
            <div><label className={LABEL}>Invoice #</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" className={INPUT} /></div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={LABEL + ' mb-0'}>Materials *</label>
              {totalWeight > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">Total: <strong className="text-gray-900 dark:text-gray-100">{totalWeight.toFixed(1)} kg</strong></span>}
            </div>
            <div className="grid grid-cols-12 gap-1.5 text-xs text-gray-400 uppercase tracking-wider px-1 mb-1.5">
              <div className="col-span-4">Item</div><div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3">Unit</div><div className="col-span-2 text-right">kg</div><div className="col-span-1"/>
            </div>
            <div className="space-y-2">
              {items.map(row => (
                <div key={row.id} className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-4"><input value={row.name} onChange={e => updateItem(row.id,'name',e.target.value)} placeholder="Item"
                    className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-2.5 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-400 dark:placeholder-gray-600" /></div>
                  <div className="col-span-2"><input type="number" min="0" value={row.qty} onChange={e => updateItem(row.id,'qty',e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2.5 text-sm text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500" /></div>
                  <div className="col-span-3"><select value={row.unit} onChange={e => updateItem(row.id,'unit',e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-1.5 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                  <div className="col-span-2"><input type="number" min="0" step="0.1" value={row.weight} onChange={e => updateItem(row.id,'weight',e.target.value)}
                    placeholder="—" className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2.5 text-sm text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-300 dark:placeholder-gray-600" /></div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeItem(row.id)} className="p-1 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-3 text-sm text-brand-500 hover:text-brand-600 transition-colors">+ Add item</button>
          </div>
          <NavButtons wizardStep={wizardStep} onNext={next} onBack={back} accentBtn={accentBtn} />
        </div>
      )}

      {/* ── STEP 3: Photos + Confirm ── */}
      {wizardStep === 3 && (
        <div className="space-y-5">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Summary</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400 dark:text-gray-500">Type:</span> <span className={`font-bold ml-1 ${isInward ? 'text-emerald-600' : 'text-amber-600'}`}>{passType.toUpperCase()}</span></div>
              <div><span className="text-gray-400 dark:text-gray-500">Vehicle:</span> <span className="text-gray-900 dark:text-gray-100 font-mono ml-1">{vehicleNumber}</span></div>
              <div className="col-span-2"><span className="text-gray-400 dark:text-gray-500">Party:</span> <span className="text-gray-900 dark:text-gray-100 ml-1">{partyName}</span></div>
              <div><span className="text-gray-400 dark:text-gray-500">Items:</span> <span className="text-gray-900 dark:text-gray-100 ml-1">{items.filter(r=>r.name).length}</span></div>
              {totalWeight > 0 && <div><span className="text-gray-400 dark:text-gray-500">Weight:</span> <span className="text-gray-900 dark:text-gray-100 ml-1">{totalWeight.toFixed(1)} kg</span></div>}
            </div>
          </div>

          <div>
            <label className={LABEL}>Photos (optional)</label>
            <div className="grid grid-cols-2 gap-4">
              <PhotoCaptureWidget label="Vehicle photo" compact onCapture={url => setVehiclePhotoUrl(url)} />
              <PhotoCaptureWidget label="Document" compact onCapture={url => setDocumentPhotoUrl(url)} />
            </div>
          </div>

          <div><label className={LABEL}>Remarks</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
              placeholder="Any additional notes…" className={INPUT + ' resize-none'} /></div>

          <NavButtons wizardStep={wizardStep} onNext={submit} onBack={back} accentBtn={accentBtn} submitting={submitting} />
        </div>
      )}
    </>
  )
}

function NavButtons({ wizardStep, onNext, onBack, accentBtn, submitting }: {
  wizardStep: number; onNext: () => void; onBack: () => void; accentBtn: string; submitting?: boolean
}) {
  return (
    <div className="flex gap-3 pt-2">
      {wizardStep > 1 && (
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-5 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
      )}
      <button type="button" onClick={onNext} disabled={submitting}
        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50 transition-colors ${accentBtn}`}>
        {submitting
          ? <><Loader2 size={18} className="animate-spin" /> Creating…</>
          : wizardStep === 3
            ? <><Printer size={18} /> Generate Gate Pass</>
            : <>Next <ChevronRight size={16} /></>
        }
      </button>
    </div>
  )
}

export default function NewGatePassPage() {
  return <Suspense><NewGatePassPageInner /></Suspense>
}
