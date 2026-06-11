'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { CheckCircle, Loader2, Package, Clock, AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { PhotoCaptureWidget } from '@/components/ui/PhotoCaptureWidget'
import { VendorAutocomplete } from '@/components/ui/VendorAutocomplete'
import { useField } from '@/lib/config'

interface ActiveCheckin { id: string; host_name: string; visitor: { name: string } | null }
interface Category {
  id: string; name: string; icon: string | null; color: string | null
  requires_approval: boolean; requires_photo: boolean; requires_value: boolean
  value_threshold_inr: number | null
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500'
const LABEL = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

function GuardMaterialPageInner() {
  const searchParams = useSearchParams()
  const defaultDir   = (searchParams.get('d') ?? 'out') as 'in' | 'out'

  const fDesc       = useField('material_description')
  const fQty        = useField('material_quantity')
  const fCategory   = useField('material_category')
  const fValue      = useField('material_value')
  const fVendor     = useField('material_vendor')
  const fPhoto      = useField('material_photo')
  const fReturnable = useField('material_returnable')

  const [itemName,       setItemName]       = useState('')
  const [quantity,       setQuantity]       = useState('1')
  const [direction,      setDirection]      = useState<'in' | 'out'>(defaultDir)
  const [categories,     setCategories]     = useState<Category[]>([])
  const [categoryId,     setCategoryId]     = useState('')
  const [selectedCat,    setSelectedCat]    = useState<Category | null>(null)
  const [vendorName,     setVendorName]     = useState('')
  const [vendorId,       setVendorId]       = useState<string | null>(null)
  const [valueInr,       setValueInr]       = useState('')
  const [isReturnable,   setIsReturnable]   = useState(false)
  const [returnDate,     setReturnDate]     = useState('')
  const [photoUrl,       setPhotoUrl]       = useState('')
  const [checkinId,      setCheckinId]      = useState('')
  const [checkins,       setCheckins]       = useState<ActiveCheckin[]>([])
  const [submitting,     setSubmitting]     = useState(false)
  const [done,           setDone]           = useState(false)
  const [savedItem,      setSavedItem]      = useState('')
  const [pendingApproval, setPendingApproval] = useState(false)
  const [approvalId,      setApprovalId]     = useState('')
  const [approvalStatus,  setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('')

  useEffect(() => {
    fetch('/api/dashboard/checkins/active').then(r => r.json()).then(d => setCheckins(d.checkins ?? [])).catch(() => {})
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories ?? [])).catch(() => {})
  }, [])

  // Poll approval status
  useEffect(() => {
    if (!approvalId) return
    const t = setInterval(async () => {
      const res = await fetch(`/api/approvals/${approvalId}/status`)
      const d = await res.json()
      const status = d.approval?.status
      if (status === 'approved') { setApprovalStatus('approved'); clearInterval(t) }
      else if (status === 'rejected') { setApprovalStatus('rejected'); clearInterval(t) }
    }, 5000)
    return () => clearInterval(t)
  }, [approvalId])

  function handleCategoryChange(id: string) {
    setCategoryId(id)
    const cat = categories.find(c => c.id === id) ?? null
    setSelectedCat(cat)
  }

  function needsApproval(): boolean {
    if (!selectedCat) return false
    if (selectedCat.requires_approval) return true
    if (selectedCat.value_threshold_inr && valueInr && +valueInr >= selectedCat.value_threshold_inr) return true
    return false
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fDesc !== 'hidden' && !itemName.trim()) { toast.error('Item name required'); return }
    const photoRequired = fPhoto !== 'hidden' && (fPhoto === 'required' || selectedCat?.requires_photo)
    const valueRequired = fValue !== 'hidden' && (fValue === 'required' || selectedCat?.requires_value)
    if (photoRequired && !photoUrl) { toast.error('Photo is required'); return }
    if (valueRequired && !valueInr) { toast.error('Value is required'); return }

    setSubmitting(true)

    const body = {
      item_name:            itemName.trim(),
      quantity:             Number(quantity) || 1,
      direction,
      category:             selectedCat?.name ?? 'other',
      category_id:          categoryId || null,
      vendor_name:          vendorName || null,
      vendor_id:            vendorId || null,
      value_inr:            valueInr ? Number(valueInr) : null,
      is_returnable:        isReturnable,
      expected_return_date: isReturnable && returnDate ? returnDate : null,
      return_status:        isReturnable ? 'pending' : 'not_applicable',
      entry_photo_url:      photoUrl || null,
      return_expected:      isReturnable,
      checkin_id:           checkinId || null,
      approval_status:      needsApproval() ? 'pending' : 'auto_approved',
    }

    const res = await fetch('/api/guard/material', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }

    if (needsApproval()) {
      // Create approval request for high-value/restricted material
      const approvalRes = await fetch('/api/approvals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'high_value_material',
          material_id: data.material?.id,
          material_description: itemName,
          material_value: valueInr ? Number(valueInr) : null,
          material_photo_url: photoUrl || null,
        }),
      })
      const approvalData = await approvalRes.json()
      setApprovalId(approvalData.approval?.id ?? '')
      setApprovalStatus('pending')
      setPendingApproval(true)
      setSavedItem(itemName)
    } else {
      setSavedItem(itemName)
      setDone(true)
    }
  }

  const reset = () => {
    setItemName(''); setQuantity('1'); setDirection(defaultDir); setCategoryId(''); setSelectedCat(null)
    setVendorName(''); setVendorId(null); setValueInr(''); setIsReturnable(false); setReturnDate('')
    setPhotoUrl(''); setCheckinId(''); setDone(false); setSavedItem('')
    setPendingApproval(false); setApprovalId(''); setApprovalStatus('')
  }

  // Approval waiting screen
  if (pendingApproval) {
    return (
      <div className="text-center py-16 space-y-5">
        {approvalStatus === 'approved' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Approved!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Admin approved {savedItem} · {direction.toUpperCase()}</p>
            </div>
            <button onClick={reset} className="px-5 py-2.5 text-white rounded-xl text-sm font-medium" style={{ background: '#16A34A' }}>Log Another</button>
          </>
        ) : approvalStatus === 'rejected' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Request Rejected</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Admin rejected entry of {savedItem}</p>
            </div>
            <button onClick={reset} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">Go Back</button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
              <Clock size={32} className="text-orange-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Waiting for Admin Approval</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{savedItem} requires admin approval before entry</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Checking status every 5 seconds…</p>
            </div>
            <div className="flex justify-center">
              <Loader2 size={24} className="animate-spin text-orange-400" />
            </div>
          </>
        )}
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-16 space-y-5">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Material Logged!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{savedItem} · {direction.toUpperCase()}</p>
          {isReturnable && <p className="text-xs text-amber-500 mt-0.5">Return tracking enabled</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 text-white rounded-xl text-sm font-medium" style={{ background: '#16A34A' }}>
            Log Another
          </button>
        </div>
      </div>
    )
  }

  const photoRequired  = fPhoto !== 'hidden' && !!(fPhoto === 'required' || selectedCat?.requires_photo)
  const valueRequired  = fValue !== 'hidden' && !!(fValue === 'required' || selectedCat?.requires_value)
  const approvalWarning = needsApproval()

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Log Material</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Record an item entering or leaving the premises.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Direction toggle */}
        <div>
          <label className={LABEL}>Direction</label>
          <div className="grid grid-cols-2 gap-3">
            {(['in', 'out'] as const).map(d => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={`py-3 rounded-xl font-semibold text-sm transition-colors border ${
                  direction === d
                    ? d === 'in' ? 'text-white border-brand-500' : 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
                style={direction === d && d === 'in' ? { background: '#16A34A', borderColor: '#16A34A' } : undefined}>
                {d === 'in' ? '↓ IN (Arriving)' : '↑ OUT (Leaving)'}
              </button>
            ))}
          </div>
        </div>

        {fDesc !== 'hidden' && (
          <div>
            <label className={LABEL}>Item name{fDesc === 'required' ? ' *' : ''}</label>
            <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Laptop, ID card, Parcel…" className={INPUT} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {fCategory !== 'hidden' && (
            <div>
              <label className={LABEL}>Category</label>
              <select value={categoryId} onChange={e => handleCategoryChange(e.target.value)} className={INPUT}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          )}
          {fQty !== 'hidden' && (
            <div>
              <label className={LABEL}>Quantity</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className={INPUT} />
            </div>
          )}
        </div>

        {/* Approval warning banner */}
        {approvalWarning && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Admin Approval Required</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {selectedCat?.requires_approval ? `${selectedCat.name} requires admin approval` : `Value above ₹${selectedCat?.value_threshold_inr?.toLocaleString()} requires approval`}
              </p>
            </div>
          </div>
        )}

        {fVendor !== 'hidden' && (
          <div>
            <label className={LABEL}>Vendor / Carrier{fVendor === 'required' ? ' *' : ''}</label>
            <VendorAutocomplete value={vendorName} vendorId={vendorId}
              onChange={(name, vendor) => { setVendorName(name); setVendorId(vendor?.id ?? null) }}
              placeholder="Search or type vendor name…" />
          </div>
        )}

        {fValue !== 'hidden' && (
          <div>
            <label className={LABEL}>Estimated Value (₹){valueRequired ? ' *' : ''}</label>
            <input type="number" min="0" value={valueInr} onChange={e => setValueInr(e.target.value)} placeholder="0" className={INPUT} />
          </div>
        )}

        {/* Returnable toggle */}
        {fReturnable !== 'hidden' && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input type="checkbox" checked={isReturnable} onChange={e => setIsReturnable(e.target.checked)} className="accent-brand-500 w-4 h-4" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Will be returned</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Enable return tracking for this item</p>
              </div>
            </label>
            {isReturnable && (
              <div>
                <label className={LABEL}>Expected Return Date</label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className={INPUT} />
              </div>
            )}
          </div>
        )}

        {/* Photo */}
        {fPhoto !== 'hidden' && (
          <div>
            <label className={LABEL}>Photo proof{photoRequired ? ' *' : ''}</label>
            <PhotoCaptureWidget label="" compact onCapture={url => setPhotoUrl(url)} />
            {photoRequired && !photoUrl && (
              <p className="text-xs text-amber-500 mt-1">📸 Photo is required</p>
            )}
          </div>
        )}

        <div>
          <label className={LABEL}>Link to visitor (optional)</label>
          <select value={checkinId} onChange={e => setCheckinId(e.target.value)} className={INPUT}>
            <option value="">— No visitor linked —</option>
            {checkins.map(c => <option key={c.id} value={c.id}>{c.visitor?.name ?? 'Unknown'} → {c.host_name}</option>)}
            {checkins.length === 0 && <option disabled>No active check-ins today</option>}
          </select>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          style={{ background: '#16A34A' }}>
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
            : approvalWarning
              ? <><AlertTriangle size={16} /> Submit for Approval</>
              : <><Package size={16} /> Log {direction.toUpperCase()}</>
          }
        </button>
      </form>
    </>
  )
}

export default function GuardMaterialPage() {
  return <Suspense><GuardMaterialPageInner /></Suspense>
}
