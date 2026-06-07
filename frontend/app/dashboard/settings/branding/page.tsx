'use client'
import { useEffect, useRef, useState } from 'react'
import { Upload, Save, Building2, PenLine, FileText, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
interface BrandingForm {
  // Company info
  logo_url: string
  legal_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  gst_number: string
  cin_number: string
  phone: string
  email: string
  website: string
  // Documents
  authorized_signatory_name: string
  authorized_signatory_designation: string
  signature_url: string
  stamp_url: string
  // Footer
  footer_text: string
}

const EMPTY: BrandingForm = {
  logo_url: '', legal_name: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', gst_number: '', cin_number: '',
  phone: '', email: '', website: '',
  authorized_signatory_name: '', authorized_signatory_designation: '',
  signature_url: '', stamp_url: '',
  footer_text: 'This is a system-generated gate pass. Valid for one-time use only.',
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>{hint}</p>}
    </div>
  )
}

function Input({
  value, onChange, placeholder, maxLength, pattern,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  pattern?: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      pattern={pattern}
      className="w-full px-3 py-2 text-sm rounded-lg transition-colors"
      style={{
        border: '1px solid #EAEAEA',
        background: '#FFFFFF',
        color: '#0A0A0A',
        outline: 'none',
      }}
      onFocus={e => { e.target.style.borderColor = '#18181B' }}
      onBlur={e => { e.target.style.borderColor = '#EAEAEA' }}
    />
  )
}

function UploadZone({
  label, hint, value, assetType, onUploaded,
}: {
  label: string
  hint: string
  value: string
  assetType: 'logo' | 'signature' | 'stamp'
  onUploaded: (url: string) => void
}) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('File must be ≤ 2 MB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', assetType)
      const res  = await fetch('/api/dashboard/branding/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) { onUploaded(json.url); toast.success('Uploaded!') }
      else toast.error(json.error ?? 'Upload failed')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#0A0A0A' }}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f) }}
        className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
        style={{ borderColor: dragging ? '#10B981' : '#EAEAEA', background: dragging ? '#F0FDF4' : '#FAFAFA' }}
      >
        {value ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="max-h-20 max-w-full object-contain rounded" />
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Click to replace</p>
          </div>
        ) : uploading ? (
          <p className="text-sm py-4" style={{ color: '#9CA3AF' }}>Uploading…</p>
        ) : (
          <div className="py-3">
            <Upload size={20} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Drop here or click to browse</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{hint}</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f) }} />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
type Tab = 'info' | 'documents' | 'footer'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'info',      label: 'Company Info',       icon: <Building2 size={14} /> },
  { id: 'documents', label: 'Signature & Stamp',  icon: <PenLine   size={14} /> },
  { id: 'footer',    label: 'Footer',              icon: <FileText  size={14} /> },
]

export default function BrandingPage() {
  const [tab,     setTab]     = useState<Tab>('info')
  const [form,    setForm]    = useState<BrandingForm>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [companyId, setCompanyId] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/company')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setCompanyId(d.id ?? '')
        setForm({
          logo_url:                         d.logo_url                         ?? '',
          legal_name:                       d.legal_name                       ?? '',
          address_line1:                    d.address_line1                    ?? '',
          address_line2:                    d.address_line2                    ?? '',
          city:                             d.city                             ?? '',
          state:                            d.state                            ?? '',
          pincode:                          d.pincode                          ?? '',
          gst_number:                       d.gst_number                       ?? '',
          cin_number:                       d.cin_number                       ?? '',
          phone:                            d.phone                            ?? '',
          email:                            d.email                            ?? '',
          website:                          d.website                          ?? '',
          authorized_signatory_name:        d.authorized_signatory_name        ?? '',
          authorized_signatory_designation: d.authorized_signatory_designation ?? '',
          signature_url:                    d.signature_url                    ?? '',
          stamp_url:                        d.stamp_url                        ?? '',
          footer_text:                      d.footer_text                      ?? EMPTY.footer_text,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof BrandingForm) => (v: string) => setForm(f => ({ ...f, [key]: v }))

  const save = async () => {
    if (!companyId) { toast.error('Company not found'); return }
    const gst = form.gst_number.trim()
    if (gst && gst.length !== 15) { toast.error('GST number must be 15 characters'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/company', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: companyId, ...form }),
      })
      const data = await res.json()
      if (data.id) toast.success('Branding saved!')
      else toast.error(data.error ?? 'Failed to save')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-6 w-40 rounded" style={{ background: '#F5F5F5' }} />
        <div className="h-64 rounded-xl" style={{ background: '#F5F5F5' }} />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#0A0A0A' }}>Company Branding</h1>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
          Used on gate passes, PDFs, and all printed documents
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: '#F5F5F5' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
              style={tab === t.id
                ? { background: '#FFFFFF', color: '#0A0A0A', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#6B7280' }
              }
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '24px' }}>

          {/* ── TAB: Company Info ───────────────────────────────── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <UploadZone
                label="Company Logo"
                hint="PNG / JPG · recommended 200×200 px · max 2 MB"
                value={form.logo_url}
                assetType="logo"
                onUploaded={set('logo_url')}
              />

              <Field label="Legal / Registered Name" hint="e.g. TechCorp India Pvt. Ltd.">
                <Input value={form.legal_name} onChange={set('legal_name')} placeholder="Acme Corporation Pvt. Ltd." />
              </Field>

              <div className="pt-2 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Address</p>
              </div>
              <Field label="Address Line 1">
                <Input value={form.address_line1} onChange={set('address_line1')} placeholder="123 Business Park, Sector 5" />
              </Field>
              <Field label="Address Line 2">
                <Input value={form.address_line2} onChange={set('address_line2')} placeholder="Near City Mall (optional)" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="City">
                  <Input value={form.city} onChange={set('city')} placeholder="Mumbai" />
                </Field>
                <Field label="State">
                  <select
                    value={form.state}
                    onChange={e => set('state')(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: '1px solid #EAEAEA', background: '#FFFFFF', color: '#0A0A0A' }}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode">
                  <Input value={form.pincode} onChange={set('pincode')} placeholder="400001" maxLength={6} />
                </Field>
              </div>

              <div className="pt-2 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Registration</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="GST Number" hint="15 characters">
                  <Input
                    value={form.gst_number}
                    onChange={v => set('gst_number')(v.toUpperCase())}
                    placeholder="27AABCT1234A1Z5"
                    maxLength={15}
                  />
                </Field>
                <Field label="CIN Number (optional)">
                  <Input value={form.cin_number} onChange={set('cin_number')} placeholder="U12345MH2010PTC123456" />
                </Field>
              </div>

              <div className="pt-2 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Contact</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Email">
                  <Input value={form.email} onChange={set('email')} placeholder="admin@company.com" />
                </Field>
              </div>
              <Field label="Website (optional)">
                <Input value={form.website} onChange={set('website')} placeholder="https://www.company.com" />
              </Field>
            </div>
          )}

          {/* ── TAB: Signature & Stamp ──────────────────────────── */}
          {tab === 'documents' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Authorized Signatory Name">
                  <Input value={form.authorized_signatory_name} onChange={set('authorized_signatory_name')} placeholder="Arjun Mehta" />
                </Field>
                <Field label="Designation">
                  <Input value={form.authorized_signatory_designation} onChange={set('authorized_signatory_designation')} placeholder="Director" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <UploadZone
                  label="Signature Image"
                  hint="Transparent PNG · max 2 MB"
                  value={form.signature_url}
                  assetType="signature"
                  onUploaded={set('signature_url')}
                />
                <UploadZone
                  label="Company Stamp / Seal"
                  hint="Transparent PNG · max 2 MB"
                  value={form.stamp_url}
                  assetType="stamp"
                  onUploaded={set('stamp_url')}
                />
              </div>

              {/* Live preview */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Preview</p>
                <div className="rounded-xl p-5" style={{ background: '#FAFAFA', border: '1px solid #EAEAEA' }}>
                  <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Authorized by:</p>
                  <div className="flex items-start gap-4">
                    {/* Signature box */}
                    <div
                      className="flex items-center justify-center rounded-lg overflow-hidden"
                      style={{ width: 120, height: 60, border: '1px dashed #D1D5DB', background: '#FFFFFF' }}
                    >
                      {form.signature_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={form.signature_url} alt="Signature" className="max-h-full max-w-full object-contain" />
                        : <span className="text-xs" style={{ color: '#D1D5DB' }}>Signature</span>
                      }
                    </div>
                    {/* Stamp circle */}
                    <div
                      className="flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
                      style={{ width: 64, height: 64, border: '1px dashed #D1D5DB', background: '#FFFFFF' }}
                    >
                      {form.stamp_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={form.stamp_url} alt="Stamp" className="max-h-full max-w-full object-contain" />
                        : <span className="text-xs" style={{ color: '#D1D5DB' }}>Stamp</span>
                      }
                    </div>
                  </div>
                  {form.authorized_signatory_name && (
                    <p className="text-sm font-medium mt-2" style={{ color: '#0A0A0A' }}>{form.authorized_signatory_name}</p>
                  )}
                  {form.authorized_signatory_designation && (
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{form.authorized_signatory_designation}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Footer ─────────────────────────────────────── */}
          {tab === 'footer' && (
            <div className="space-y-4">
              <Field label="Footer Text" hint="Printed at the bottom of gate passes, visit slips, and other documents">
                <textarea
                  value={form.footer_text}
                  onChange={e => set('footer_text')(e.target.value)}
                  rows={4}
                  placeholder="This is a system generated gate pass. Valid for one-time use only."
                  className="w-full px-3 py-2 text-sm rounded-lg resize-none"
                  style={{ border: '1px solid #EAEAEA', background: '#FFFFFF', color: '#0A0A0A', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#18181B' }}
                  onBlur={e => { e.target.style.borderColor = '#EAEAEA' }}
                />
              </Field>

              {/* Preview */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Preview</p>
                <div className="rounded-xl p-4" style={{ background: '#FAFAFA', border: '1px solid #EAEAEA' }}>
                  <div className="mb-3" style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                      {form.footer_text || '(no footer text)'}
                    </p>
                    <p className="text-xs text-center mt-1" style={{ color: '#D1D5DB' }}>
                      Generated by VisBot · visbot.app
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: '#18181B', color: '#FFFFFF' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#27272A' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#18181B' }}
            >
              {saving ? <><Save size={14} /> Saving…</> : <><CheckCircle size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
