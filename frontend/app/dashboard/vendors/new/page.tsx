'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

export default function NewVendorPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
    gst_number: '', vendor_type: 'other', services_provided: '',
    notes: '', is_preferred: false,
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error('Vendor name is required')
    setSaving(true)
    try {
      const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Vendor added successfully')
      router.push(`/dashboard/vendors/${d.vendor.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save vendor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/vendors" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Vendor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a new vendor to your master list</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vendor Name" required>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Reliable Couriers Pvt Ltd" className={INPUT} />
            </Field>
            <Field label="Contact Person">
              <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Primary contact name" className={INPUT} />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile number" className={INPUT} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@vendor.com" className={INPUT} />
            </Field>
            <Field label="Vendor Type">
              <select value={form.vendor_type} onChange={e => set('vendor_type', e.target.value)} className={INPUT}>
                {['supplier','contractor','courier','service','other'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="GST Number">
              <input value={form.gst_number} onChange={e => set('gst_number', e.target.value)} placeholder="22AAAAA0000A1Z5" className={INPUT} />
            </Field>
          </div>
          <Field label="Services Provided">
            <input value={form.services_provided} onChange={e => set('services_provided', e.target.value)} placeholder="Brief description of services" className={INPUT} />
          </Field>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Address</h2>
          <Field label="Address">
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" className={INPUT} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Delhi" className={INPUT} />
            </Field>
            <Field label="State">
              <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Delhi" className={INPUT} />
            </Field>
            <Field label="Pincode">
              <input value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="110001" className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Notes & Preferences</h2>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes about this vendor" rows={3} className={INPUT} />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_preferred} onChange={e => set('is_preferred', e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${form.is_preferred ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.is_preferred ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">⭐ Mark as Preferred Vendor</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: '#16A34A' }}>
            {saving ? 'Saving…' : 'Add Vendor'}
          </button>
          <Link href="/dashboard/vendors"
            className="px-6 py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
