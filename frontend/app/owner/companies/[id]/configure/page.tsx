'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, RotateCcw, Download, Loader2,
  LayoutDashboard, Grid3X3, KeyRound, ListChecks,
  Type, ListOrdered, Bell, Shield, Lock, Palette,
  Gauge, Database, History, Check, X, ChevronDown,
} from 'lucide-react'
import { CompanyConfig, DEFAULT_CONFIG } from '@/lib/config'
import { format } from 'date-fns'

type TabKey = 'overview' | 'modules' | 'otp' | 'fields' | 'labels' |
              'dropdowns' | 'notifications' | 'access' | 'security' |
              'branding' | 'limits' | 'retention' | 'history'

interface Template { name: string; display_name: string; icon: string; description: string }
interface Company  { id: string; name: string; slug: string; plan: string; active: boolean }
interface HistoryRow { id: string; changed_at: string; field_name: string; old_value: string; new_value: string; changer?: { full_name: string; email: string } }

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: string | number; className?: string }> }[] = [
  { key: 'overview',       label: 'Overview',        icon: LayoutDashboard },
  { key: 'modules',        label: 'Modules',          icon: Grid3X3 },
  { key: 'otp',            label: 'OTP',              icon: KeyRound },
  { key: 'fields',         label: 'Form Fields',      icon: ListChecks },
  { key: 'labels',         label: 'Custom Labels',    icon: Type },
  { key: 'dropdowns',      label: 'Dropdowns',        icon: ListOrdered },
  { key: 'notifications',  label: 'Notifications',    icon: Bell },
  { key: 'access',         label: 'Access Rules',     icon: Shield },
  { key: 'security',       label: 'Security',         icon: Lock },
  { key: 'branding',       label: 'Branding',         icon: Palette },
  { key: 'limits',         label: 'Limits',           icon: Gauge },
  { key: 'retention',      label: 'Data Retention',   icon: Database },
  { key: 'history',        label: 'Config History',   icon: History },
]

const MODULES = [
  { key: 'visitors',         icon: '👤', label: 'Visitors',           desc: 'Core visitor entry/exit management' },
  { key: 'materials',        icon: '📦', label: 'Materials',          desc: 'Material in/out tracking with categories' },
  { key: 'gate_passes',      icon: '🚗', label: 'Gate Passes',        desc: 'Vehicle and delivery pass management' },
  { key: 'invitations',      icon: '📩', label: 'Invitations',        desc: 'Pre-registered visitor invitations' },
  { key: 'groups',           icon: '👥', label: 'Groups',             desc: 'Multi-person group check-in' },
  { key: 'blacklist',        icon: '🚫', label: 'Blacklist',          desc: 'Block unauthorized visitors' },
  { key: 'recurring_passes', icon: '🔁', label: 'Recurring Passes',   desc: 'Auto-entry for regular contractors/staff' },
  { key: 'vendors',          icon: '🏪', label: 'Vendors',            desc: 'Vendor master list and autocomplete' },
  { key: 'approvals',        icon: '✅', label: 'Approvals',          desc: 'Two-step approval for VIP/high-value' },
  { key: 'analytics',        icon: '📊', label: 'Analytics',          desc: 'Dashboard charts and statistics' },
  { key: 'reports',          icon: '📋', label: 'Reports',            desc: 'Scheduled email/WhatsApp digest' },
  { key: 'kiosk',            icon: '🖥️', label: 'Kiosk Mode',        desc: 'Self-service visitor kiosk' },
  { key: 'multi_gate',       icon: '🚪', label: 'Multi-gate',         desc: 'Multiple entry/exit points' },
  { key: 'voice_input',      icon: '🎙️', label: 'Voice Input',        desc: 'Speak visitor details instead of typing' },
  { key: 'id_ocr',           icon: '📷', label: 'ID OCR',             desc: 'Auto-fill from Aadhaar/PAN photo' },
  { key: 'face_recognition', icon: '😀', label: 'Face Recognition',   desc: 'Biometric identity verification' },
  { key: 'offline_mode',     icon: '📡', label: 'Offline Mode',       desc: 'Works without internet connection' },
]

const VISITOR_FIELDS = [
  { key: 'visitor_name',              label: 'Name' },
  { key: 'visitor_phone',             label: 'Phone' },
  { key: 'visitor_email',             label: 'Email' },
  { key: 'visitor_company',           label: 'Company' },
  { key: 'visitor_photo',             label: 'Photo' },
  { key: 'visitor_id_proof',          label: 'ID Proof' },
  { key: 'visitor_address',           label: 'Address' },
  { key: 'visitor_vehicle',           label: 'Vehicle No.' },
  { key: 'visitor_purpose',           label: 'Purpose' },
  { key: 'visitor_host',              label: 'Host' },
  { key: 'visitor_meeting_room',      label: 'Meeting Room' },
  { key: 'visitor_items_carried',     label: 'Items Carried' },
  { key: 'visitor_temperature',       label: 'Temperature' },
  { key: 'visitor_signature',         label: 'Signature' },
  { key: 'visitor_emergency_contact', label: 'Emergency Contact' },
]

const MATERIAL_FIELDS = [
  { key: 'material_description', label: 'Description' },
  { key: 'material_quantity',    label: 'Quantity' },
  { key: 'material_category',   label: 'Category' },
  { key: 'material_value',      label: 'Value (₹)' },
  { key: 'material_vendor',     label: 'Vendor' },
  { key: 'material_photo',      label: 'Photo' },
  { key: 'material_returnable', label: 'Returnable?' },
  { key: 'material_invoice',    label: 'Invoice No.' },
  { key: 'material_po_number',  label: 'PO Number' },
  { key: 'material_gst',        label: 'GST Number' },
]

const LABEL_KEYS = [
  { key: 'visitor',   label: 'Visitor', default: 'Visitor' },
  { key: 'host',      label: 'Host', default: 'Host' },
  { key: 'purpose',   label: 'Purpose', default: 'Purpose' },
  { key: 'material',  label: 'Material', default: 'Material' },
  { key: 'gate_pass', label: 'Gate Pass', default: 'Gate Pass' },
  { key: 'company',   label: 'Company', default: 'Company' },
  { key: 'check_in',  label: 'Check-in', default: 'Check-in' },
  { key: 'check_out', label: 'Check-out', default: 'Check-out' },
]

const INPUT = 'border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
const CARD  = 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${value ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function SectionHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {desc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>}
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {desc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB COMPONENTS
// ─────────────────────────────────────────────────────────────

function OverviewTab({ config, company, templates, onApplyTemplate }: {
  config: Partial<CompanyConfig>; company: Company | null
  templates: Template[]; onApplyTemplate: (name: string) => Promise<void>
}) {
  const [applying, setApplying] = useState(false)
  const [sel, setSel] = useState('')
  const [dropOpen, setDropOpen] = useState(false)

  const activeModules = MODULES.filter(m => (config as Record<string, unknown>)[`module_${m.key}`] !== false).length

  const apply = async () => {
    if (!sel) return
    setApplying(true)
    await onApplyTemplate(sel)
    setApplying(false); setDropOpen(false)
  }

  const tpl = templates.find(t => t.name === config.industry_template)

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Plan</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">{company?.plan ?? '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Template</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tpl?.icon} {tpl?.display_name ?? config.industry_template}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Modules</p>
            <p className="text-sm font-semibold text-brand-500">{activeModules}/{MODULES.length}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">OTP on Entry</p>
            <p className={`text-sm font-semibold ${config.otp_required_on_entry ? 'text-green-600' : 'text-gray-400'}`}>
              {config.otp_required_on_entry ? 'Required' : 'Skipped'}</p></div>
        </div>
      </div>

      <div className={CARD}>
        <SectionHead title="Apply Industry Template" desc="Resets all config to the selected template's defaults." />
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <button onClick={() => setDropOpen(d => !d)}
              className={`flex items-center gap-2 px-3 py-2 border ${INPUT} min-w-48`}>
              {sel ? (templates.find(t => t.name === sel)?.icon + ' ' + templates.find(t => t.name === sel)?.display_name) : 'Choose template…'}
              <ChevronDown size={14} className="ml-auto text-gray-400" />
            </button>
            {dropOpen && (
              <ul className="absolute z-20 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                {templates.map(t => (
                  <li key={t.name}>
                    <button type="button" onClick={() => { setSel(t.name); setDropOpen(false) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                      <span>{t.icon}</span>
                      <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.display_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t.description}</p></div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={apply} disabled={!sel || applying}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            {applying ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Apply Template
          </button>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">⚠️ This will overwrite current configuration with template defaults.</p>
      </div>
    </div>
  )
}

function ModulesTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  const core     = MODULES.slice(0, 3)
  const advanced = MODULES.slice(3, 11)
  const premium  = MODULES.slice(11)

  const renderGroup = (label: string, items: typeof MODULES) => (
    <div className={CARD}>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(m => {
          const key = `module_${m.key}` as keyof CompanyConfig
          const on  = (config as Record<string, unknown>)[key] !== false
          return (
            <div key={m.key} onClick={() => onChange({ [key]: !on } as Partial<CompanyConfig>)}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${on ? 'border-brand-200 bg-brand-50 dark:bg-brand-900/10 dark:border-brand-700' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-xl mt-0.5">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{m.desc}</p>
              </div>
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${on ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {on && <Check size={10} className="text-white" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {renderGroup('Core', core)}
      {renderGroup('Advanced', advanced)}
      {renderGroup('Premium / Enterprise', premium)}
    </div>
  )
}

function OtpTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Entry OTP" desc="Controls OTP verification when a visitor arrives." />
        <ToggleRow label="Require OTP on entry" value={!!config.otp_required_on_entry} onChange={v => onChange({ otp_required_on_entry: v })} />
        <ToggleRow label="Skip OTP for returning visitors" desc="Auto-approve if phone already in system" value={!!config.otp_skip_for_returning} onChange={v => onChange({ otp_skip_for_returning: v })} />
        <ToggleRow label="Skip OTP for invitation holders" value={!!config.otp_skip_for_invitations} onChange={v => onChange({ otp_skip_for_invitations: v })} />
        <ToggleRow label="Skip OTP for recurring pass holders" value={!!config.otp_skip_for_recurring_pass} onChange={v => onChange({ otp_skip_for_recurring_pass: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="Exit OTP" desc="OTP sent to host when visitor leaves." />
        <ToggleRow label="Require OTP on exit" value={!!config.otp_required_on_exit} onChange={v => onChange({ otp_required_on_exit: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="Material Movement OTP" />
        <ToggleRow label="Require OTP for material movements" value={!!config.otp_required_for_materials} onChange={v => onChange({ otp_required_for_materials: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="Group Entry OTP" />
        <ToggleRow label="Require OTP for group check-in" value={!!config.otp_required_for_groups} onChange={v => onChange({ otp_required_for_groups: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="OTP Delivery Settings" />
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Channel</label>
            {['sms','whatsapp','both'].map(m => (
              <label key={m} className="flex items-center gap-2 py-1.5 cursor-pointer">
                <input type="radio" name="otp_method" value={m} checked={config.otp_method === m} onChange={() => onChange({ otp_method: m })} className="accent-brand-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{m === 'both' ? 'SMS + WhatsApp' : m.toUpperCase()}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">OTP Length</label>
              <select value={config.otp_length ?? 6} onChange={e => onChange({ otp_length: Number(e.target.value) })} className={INPUT + ' w-full'}>
                <option value={4}>4 digits</option><option value={6}>6 digits</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Validity (seconds)</label>
              <input type="number" value={config.otp_validity_seconds ?? 300} min={60} max={900}
                onChange={e => onChange({ otp_validity_seconds: Number(e.target.value) })} className={INPUT + ' w-full'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, fieldKey, value, onChange }: { label: string; fieldKey: string; value: string; onChange: (k: string, v: string) => void }) {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 last:border-0">
      <td className="py-2.5 pr-4 text-sm text-gray-700 dark:text-gray-300 font-medium w-48">{label}</td>
      {['hidden','optional','required'].map(opt => (
        <td key={opt} className="py-2.5 px-2 text-center">
          <input type="radio" name={fieldKey} value={opt} checked={value === opt} onChange={() => onChange(fieldKey, opt)} className="accent-brand-500" />
        </td>
      ))}
    </tr>
  )
}

function FieldsTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  const updateField = (key: string, val: string) => onChange({ [`field_${key}`]: val } as Partial<CompanyConfig>)

  const renderTable = (title: string, fields: { key: string; label: string }[]) => (
    <div className={CARD}>
      <SectionHead title={title} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Field</th>
              {['Hidden','Optional','Required'].map(h => (
                <th key={h} className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map(f => (
              <FieldRow key={f.key} label={f.label} fieldKey={f.key}
                value={(config as Record<string, unknown>)[`field_${f.key}`] as string || 'optional'}
                onChange={updateField} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {renderTable('Visitor Form Fields', VISITOR_FIELDS)}
      {renderTable('Material Form Fields', MATERIAL_FIELDS)}
    </div>
  )
}

function LabelsTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Custom Terminology" desc="Replace system terms with industry-specific language. Changes apply everywhere in the app." />
        <div className="space-y-3">
          {LABEL_KEYS.map(({ key, label, default: def }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="w-28 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</label>
              <span className="text-xs text-gray-300 dark:text-gray-600 w-20 flex-shrink-0">(was: {def})</span>
              <input
                value={(config as Record<string, unknown>)[`label_${key}`] as string || def}
                onChange={e => onChange({ [`label_${key}`]: e.target.value } as Partial<CompanyConfig>)}
                className={INPUT + ' flex-1'} placeholder={def} />
            </div>
          ))}
        </div>
      </div>
      <div className={CARD}>
        <SectionHead title="Live Preview" desc="How a phrase will appear with your custom labels." />
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          New{' '}
          <span className="font-semibold text-brand-500">{(config.label_visitor || 'Visitor')}</span>{' '}
          {(config.label_check_in || 'Check-in')}{' '}for{' '}
          <span className="font-semibold text-brand-500">{(config.label_host || 'Host')}</span>
        </div>
      </div>
    </div>
  )
}

function DropdownsTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  const purposes = (config.purposes as string[]) || DEFAULT_CONFIG.purposes
  const idTypes  = (config.id_proof_types as string[]) || DEFAULT_CONFIG.id_proof_types
  const [newPurpose, setNewPurpose] = useState('')
  const [newIdType,  setNewIdType]  = useState('')

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Visit Purposes" desc="Options shown in the purpose dropdown on all entry forms." />
        <div className="space-y-2 mb-3">
          {purposes.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">{p}</span>
              <button onClick={() => onChange({ purposes: purposes.filter((_, j) => j !== i) })}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newPurpose} onChange={e => setNewPurpose(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newPurpose.trim()) { onChange({ purposes: [...purposes, newPurpose.trim()] }); setNewPurpose('') } }}
            placeholder="Add purpose and press Enter…" className={INPUT + ' flex-1'} />
          <button onClick={() => { if (newPurpose.trim()) { onChange({ purposes: [...purposes, newPurpose.trim()] }); setNewPurpose('') } }}
            className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600">Add</button>
        </div>
      </div>
      <div className={CARD}>
        <SectionHead title="ID Proof Types" desc="Options shown in the ID proof type dropdown." />
        <div className="space-y-2 mb-3">
          {idTypes.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">{t}</span>
              <button onClick={() => onChange({ id_proof_types: idTypes.filter((_, j) => j !== i) })}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newIdType} onChange={e => setNewIdType(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newIdType.trim()) { onChange({ id_proof_types: [...idTypes, newIdType.trim()] }); setNewIdType('') } }}
            placeholder="Add ID type and press Enter…" className={INPUT + ' flex-1'} />
          <button onClick={() => { if (newIdType.trim()) { onChange({ id_proof_types: [...idTypes, newIdType.trim()] }); setNewIdType('') } }}
            className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600">Add</button>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Host Notifications" />
        <ToggleRow label="Notify host on visitor arrival" value={!!config.notify_host_on_arrival} onChange={v => onChange({ notify_host_on_arrival: v })} />
        <ToggleRow label="Notify host on visitor exit" value={!!config.notify_host_on_exit} onChange={v => onChange({ notify_host_on_exit: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="Admin Notifications" />
        <ToggleRow label="Alert admin on blacklist attempt" value={!!config.notify_admin_on_blacklist} onChange={v => onChange({ notify_admin_on_blacklist: v })} />
        <ToggleRow label="Alert admin on VIP visitor" value={!!config.notify_admin_on_vip} onChange={v => onChange({ notify_admin_on_vip: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="Notification Channel" />
        {['sms','whatsapp','email','all'].map(m => (
          <label key={m} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input type="radio" name="notify_method" value={m} checked={config.notify_method === m} onChange={() => onChange({ notify_method: m })} className="accent-brand-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{m === 'all' ? 'All channels' : m.toUpperCase()}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function AccessTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Entry Rules" />
        <ToggleRow label="Allow walk-in visitors" desc="No pre-registration required" value={!!config.allow_walk_in_visitors} onChange={v => onChange({ allow_walk_in_visitors: v })} />
        <ToggleRow label="Require pre-approval for all visitors" value={!!config.require_pre_approval} onChange={v => onChange({ require_pre_approval: v })} />
        <ToggleRow label="Require host approval before entry" value={!!config.require_host_approval} onChange={v => onChange({ require_host_approval: v })} />
      </div>
      <div className={CARD}>
        <SectionHead title="Operating Hours" desc="Entry attempts outside these hours will be flagged." />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
            <input type="time" value={config.operating_hours_start ?? '00:00'} onChange={e => onChange({ operating_hours_start: e.target.value })} className={INPUT + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
            <input type="time" value={config.operating_hours_end ?? '23:59'} onChange={e => onChange({ operating_hours_end: e.target.value })} className={INPUT + ' w-full'} />
          </div>
        </div>
      </div>
      <div className={CARD}>
        <SectionHead title="Visit Limits" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Max visitors/day (0 = unlimited)</label>
            <input type="number" min={0} value={config.max_visitors_per_day ?? 0} onChange={e => onChange({ max_visitors_per_day: Number(e.target.value) || null })} className={INPUT + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Max visit duration (hours)</label>
            <input type="number" min={1} max={72} value={config.visitor_max_duration_hours ?? 24} onChange={e => onChange({ visitor_max_duration_hours: Number(e.target.value) })} className={INPUT + ' w-full'} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Auto-blacklist after N failed OTP attempts (0 = disabled)</label>
          <input type="number" min={0} max={10} value={config.auto_blacklist_after_attempts ?? 0} onChange={e => onChange({ auto_blacklist_after_attempts: Number(e.target.value) })} className={INPUT + ' w-48'} />
        </div>
      </div>
    </div>
  )
}

function SecurityTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className={CARD}>
      <SectionHead title="Security Requirements" desc="Additional verification steps for visitors." />
      <ToggleRow label="Require ID proof photo" desc="Guard must capture Aadhaar/PAN photo" value={!!config.require_id_proof_photo} onChange={v => onChange({ require_id_proof_photo: v })} />
      <ToggleRow label="Require visitor signature" value={!!config.require_visitor_signature} onChange={v => onChange({ require_visitor_signature: v })} />
      <ToggleRow label="Capture face on exit (compare with entry)" value={!!config.capture_face_on_exit} onChange={v => onChange({ capture_face_on_exit: v })} />
      <ToggleRow label="Require temperature check" value={!!config.require_temperature_check} onChange={v => onChange({ require_temperature_check: v })} />
      <ToggleRow label="Require health declaration" value={!!config.require_health_declaration} onChange={v => onChange({ require_health_declaration: v })} />
    </div>
  )
}

function BrandingTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Brand Color" desc="Primary accent color used throughout the app." />
        <div className="flex items-center gap-4">
          <input type="color" value={config.brand_color ?? '#16A34A'} onChange={e => onChange({ brand_color: e.target.value })}
            className="w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5" />
          <input value={config.brand_color ?? '#16A34A'} onChange={e => onChange({ brand_color: e.target.value })} className={INPUT + ' w-36 font-mono'} placeholder="#16A34A" />
          <button onClick={() => onChange({ brand_color: '#16A34A' })} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Reset to VisBot green</button>
        </div>
      </div>
      <div className={CARD}>
        <SectionHead title="Logo & Assets" />
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Logo URL</label>
            <div className="flex gap-3 items-center">
              <input value={config.logo_url ?? ''} onChange={e => onChange({ logo_url: e.target.value || null })} className={INPUT + ' flex-1'} placeholder="https://…" />
              {config.logo_url && <img src={config.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Primary Font</label>
            <select value={config.primary_font ?? 'Geist'} onChange={e => onChange({ primary_font: e.target.value })} className={INPUT + ' w-full'}>
              {['Geist','Inter','Roboto','SF Pro'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function LimitsTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  const rows = [
    { key: 'max_guards',             label: 'Guards',             unit: '' },
    { key: 'max_hosts',              label: 'Hosts',              unit: '' },
    { key: 'max_gates',              label: 'Gates',              unit: '' },
    { key: 'max_visitors_per_month', label: 'Visitors / month',   unit: '' },
    { key: 'max_storage_mb',         label: 'Storage',            unit: 'MB' },
  ]
  return (
    <div className={CARD}>
      <SectionHead title="Resource Limits" desc="Override plan defaults for this company." />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {['Resource','Current Limit','Override'].map(h => (
              <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
              <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300">{r.label}</td>
              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                {(config as Record<string, unknown>)[r.key] as number ?? 'default'} {r.unit}
              </td>
              <td className="py-2.5">
                <input type="number" min={0} value={(config as Record<string, unknown>)[r.key] as number ?? ''}
                  onChange={e => onChange({ [r.key]: Number(e.target.value) } as Partial<CompanyConfig>)}
                  className={INPUT + ' w-28'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RetentionTab({ config, onChange }: { config: Partial<CompanyConfig>; onChange: (f: Partial<CompanyConfig>) => void }) {
  return (
    <div className="space-y-5">
      <div className={CARD}>
        <SectionHead title="Data Retention" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Visitor records (days)</label>
            <input type="number" min={30} value={config.retention_days ?? 365} onChange={e => onChange({ retention_days: Number(e.target.value) })} className={INPUT + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Auto-delete photos after (days)</label>
            <input type="number" min={0} value={config.auto_delete_photos_after_days ?? 180} onChange={e => onChange({ auto_delete_photos_after_days: Number(e.target.value) })} className={INPUT + ' w-full'} />
          </div>
        </div>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">⚠️ Danger Zone</p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">Export All Data</button>
          <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 opacity-60 cursor-not-allowed" disabled>Delete Company (contact support)</button>
        </div>
      </div>
    </div>
  )
}

function HistoryTab({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/owner/config/${companyId}/history`)
      .then(r => r.json())
      .then(d => { setRows(d.history ?? []); setLoading(false) })
  }, [companyId])

  if (loading) return <div className={CARD + ' animate-pulse'}><div className="h-4 bg-gray-100 rounded w-1/2" /></div>

  return (
    <div className={CARD}>
      <SectionHead title="Configuration Change Log" desc="All changes made to this company's configuration." />
      {rows.length === 0
        ? <p className="text-sm text-gray-400 py-6 text-center">No changes recorded yet.</p>
        : <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Date','Changed By','Field','Old → New'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <td className="py-2.5 pr-4 text-gray-500 text-xs whitespace-nowrap">{format(new Date(r.changed_at), 'dd MMM, HH:mm')}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 text-xs">{r.changer?.full_name ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-brand-600 dark:text-brand-400">{r.field_name}</td>
                    <td className="py-2.5 text-xs">
                      <span className="line-through text-gray-400">{r.old_value ?? 'null'}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{r.new_value ?? 'null'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function ConfigurePage() {
  const { id } = useParams<{ id: string }>()
  const [tab,       setTab]       = useState<TabKey>('overview')
  const [config,    setConfig]    = useState<Partial<CompanyConfig>>({})
  const [company,   setCompany]   = useState<Company | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [isDirty,   setIsDirty]   = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/owner/config/${id}`).then(r => r.json()),
      fetch('/api/owner/templates').then(r => r.json()),
    ]).then(([cfgData, tmplData]) => {
      setConfig({ ...DEFAULT_CONFIG, ...(cfgData.config ?? {}) })
      setCompany(cfgData.company ?? null)
      setTemplates(tmplData.templates ?? [])
      setLoading(false)
    })
  }, [id])

  const update = useCallback((fields: Partial<CompanyConfig>) => {
    setConfig(prev => ({ ...prev, ...fields }))
    setIsDirty(true)
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/owner/config/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (res.ok) { setIsDirty(false); toast.success('Configuration saved') }
    else toast.error('Save failed')
    setSaving(false)
  }

  const applyTemplate = useCallback(async (name: string) => {
    const res = await fetch(`/api/owner/config/${id}/template`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_name: name }),
    })
    if (res.ok) {
      const d = await res.json()
      setConfig({ ...DEFAULT_CONFIG, ...d.config })
      setIsDirty(false)
      toast.success(`Applied ${name} template`)
    } else toast.error('Failed to apply template')
  }, [id])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-5xl">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  const TAB_CONTENT: Record<TabKey, React.ReactNode> = {
    overview:       <OverviewTab config={config} company={company} templates={templates} onApplyTemplate={applyTemplate} />,
    modules:        <ModulesTab config={config} onChange={update} />,
    otp:            <OtpTab config={config} onChange={update} />,
    fields:         <FieldsTab config={config} onChange={update} />,
    labels:         <LabelsTab config={config} onChange={update} />,
    dropdowns:      <DropdownsTab config={config} onChange={update} />,
    notifications:  <NotificationsTab config={config} onChange={update} />,
    access:         <AccessTab config={config} onChange={update} />,
    security:       <SecurityTab config={config} onChange={update} />,
    branding:       <BrandingTab config={config} onChange={update} />,
    limits:         <LimitsTab config={config} onChange={update} />,
    retention:      <RetentionTab config={config} onChange={update} />,
    history:        <HistoryTab companyId={id} />,
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/owner/companies/${id}`} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{company?.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Feature Configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/api/owner/config/${id}/export`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Download size={14} /> Export
          </a>
          <button onClick={save} disabled={!isDirty || saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isDirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Layout: sidebar tabs + content */}
      <div className="flex gap-5">
        {/* Vertical tab nav */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                tab === key
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {TAB_CONTENT[tab]}
        </div>
      </div>

      {/* Sticky save bar when dirty */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-lg shadow-2xl z-50">
          <span className="text-sm font-medium">You have unsaved changes</span>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
          </button>
        </div>
      )}
    </>
  )
}
