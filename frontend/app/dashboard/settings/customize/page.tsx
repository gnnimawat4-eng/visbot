'use client'
import { useEffect, useState } from 'react'
import { Save, Loader2, Lock, Palette, Type, Bell, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { DEFAULT_CONFIG } from '@/lib/config'

type SubTab = 'branding' | 'labels' | 'notifications'

const INPUT = 'border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
const CARD  = 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

const LABEL_KEYS = [
  { key: 'visitor',   label: 'Visitor',   default: 'Visitor' },
  { key: 'host',      label: 'Host',      default: 'Host' },
  { key: 'purpose',   label: 'Purpose',   default: 'Purpose' },
  { key: 'material',  label: 'Material',  default: 'Material' },
  { key: 'gate_pass', label: 'Gate Pass', default: 'Gate Pass' },
  { key: 'company',   label: 'Company',   default: 'Company' },
  { key: 'check_in',  label: 'Check-in',  default: 'Check-in' },
  { key: 'check_out', label: 'Check-out', default: 'Check-out' },
]

const LOCKED_TABS: { key: SubTab; label: string; icon: React.ComponentType<{ size?: string | number }> }[] = [
  { key: 'branding',      label: 'Branding',         icon: Palette },
  { key: 'labels',        label: 'Labels & Purposes', icon: Type },
  { key: 'notifications', label: 'Notifications',     icon: Bell },
]

const READ_ONLY = [
  { label: 'Modules',        desc: 'Enable/disable feature modules' },
  { label: 'OTP Config',     desc: 'Control when OTP is required' },
  { label: 'Form Fields',    desc: 'Show/hide form fields' },
  { label: 'Access Rules',   desc: 'Operating hours, entry limits' },
  { label: 'Security',       desc: 'ID proof, temperature checks' },
  { label: 'Resource Limits',desc: 'Guard/host/visitor limits' },
]

export default function CustomizePage() {
  const [tab, setTab] = useState<SubTab>('branding')

  // Branding
  const [brandColor,  setBrandColor]  = useState('#16A34A')
  const [logoUrl,     setLogoUrl]     = useState('')
  const [primaryFont, setPrimaryFont] = useState('Geist')
  const [savingB,     setSavingB]     = useState(false)

  // Labels
  const [labels,  setLabels]  = useState<Record<string, string>>({})
  const [purposes, setPurposes] = useState<string[]>(DEFAULT_CONFIG.purposes)
  const [newPurpose, setNewPurpose] = useState('')
  const [savingL, setSavingL] = useState(false)

  // Notifications
  const [notifs,  setNotifs]  = useState({ notify_host_on_arrival: true, notify_host_on_exit: false, notify_admin_on_blacklist: true, notify_admin_on_vip: true, notify_method: 'whatsapp' })
  const [savingN, setSavingN] = useState(false)

  useEffect(() => {
    fetch('/api/config/current')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.config) return
        const c = d.config
        setBrandColor(c.brand_color ?? '#16A34A')
        setLogoUrl(c.logo_url ?? '')
        setPrimaryFont(c.primary_font ?? 'Geist')
        const lmap: Record<string, string> = {}
        LABEL_KEYS.forEach(({ key }) => { lmap[key] = c[`label_${key}`] ?? '' })
        setLabels(lmap)
        if (c.purposes) setPurposes(c.purposes)
        setNotifs({
          notify_host_on_arrival:   c.notify_host_on_arrival   ?? true,
          notify_host_on_exit:      c.notify_host_on_exit      ?? false,
          notify_admin_on_blacklist: c.notify_admin_on_blacklist ?? true,
          notify_admin_on_vip:      c.notify_admin_on_vip      ?? true,
          notify_method:            c.notify_method             ?? 'whatsapp',
        })
      })
  }, [])

  const saveBranding = async () => {
    setSavingB(true)
    const res = await fetch('/api/config/branding', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_color: brandColor, logo_url: logoUrl || null, primary_font: primaryFont }),
    })
    if (res.ok) toast.success('Branding saved')
    else toast.error('Save failed')
    setSavingB(false)
  }

  const saveLabels = async () => {
    setSavingL(true)
    const body: Record<string, unknown> = { purposes }
    LABEL_KEYS.forEach(({ key }) => { if (labels[key]) body[`label_${key}`] = labels[key] })
    const res = await fetch('/api/config/labels', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) toast.success('Labels saved')
    else toast.error('Save failed')
    setSavingL(false)
  }

  const saveNotifications = async () => {
    setSavingN(true)
    const res = await fetch('/api/config/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifs),
    })
    if (res.ok) toast.success('Notifications saved')
    else toast.error('Save failed')
    setSavingN(false)
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Customize</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure branding, labels, and notification preferences for your company.</p>
      </div>

      <div className="flex gap-5">
        {/* Sub-tabs */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {LOCKED_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${tab === key ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Read-only</p>
            {READ_ONLY.map(r => (
              <div key={r.label} className="flex items-center gap-2 px-3 py-2 opacity-50">
                <Lock size={12} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.label}</p>
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {tab === 'branding' && (
            <>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Brand Color</p>
                <div className="flex items-center gap-4">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 cursor-pointer" />
                  <input value={brandColor} onChange={e => setBrandColor(e.target.value)} className={INPUT + ' w-36 font-mono'} />
                  <button onClick={() => setBrandColor('#16A34A')} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Reset</button>
                </div>
              </div>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Logo & Font</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Logo URL</label>
                    <div className="flex gap-3 items-center">
                      <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={INPUT + ' flex-1'} placeholder="https://…" />
                      {logoUrl && <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Primary Font</label>
                    <select value={primaryFont} onChange={e => setPrimaryFont(e.target.value)} className={INPUT + ' w-full'}>
                      {['Geist','Inter','Roboto','SF Pro'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={saveBranding} disabled={savingB} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50">
                {savingB ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Branding
              </button>
            </>
          )}

          {tab === 'labels' && (
            <>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Custom Terminology</p>
                <div className="space-y-3">
                  {LABEL_KEYS.map(({ key, label, default: def }) => (
                    <div key={key} className="flex items-center gap-4">
                      <label className="w-28 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</label>
                      <input value={labels[key] ?? ''} onChange={e => setLabels(l => ({ ...l, [key]: e.target.value }))}
                        className={INPUT + ' flex-1'} placeholder={def} />
                    </div>
                  ))}
                </div>
              </div>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Visit Purposes</p>
                <div className="space-y-2 mb-3">
                  {purposes.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">{p}</span>
                      <button onClick={() => setPurposes(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newPurpose} onChange={e => setNewPurpose(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newPurpose.trim()) { setPurposes(p => [...p, newPurpose.trim()]); setNewPurpose('') } }}
                    placeholder="Add purpose, press Enter…" className={INPUT + ' flex-1'} />
                  <button onClick={() => { if (newPurpose.trim()) { setPurposes(p => [...p, newPurpose.trim()]); setNewPurpose('') } }}
                    className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600">Add</button>
                </div>
              </div>
              <button onClick={saveLabels} disabled={savingL} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50">
                {savingL ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Labels
              </button>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Host Notifications</p>
                {[
                  { key: 'notify_host_on_arrival', label: 'Notify host on visitor arrival' },
                  { key: 'notify_host_on_exit',    label: 'Notify host on visitor exit' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{label}</p>
                    <Toggle value={notifs[key as keyof typeof notifs] as boolean} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin Notifications</p>
                {[
                  { key: 'notify_admin_on_blacklist', label: 'Alert on blacklist attempt' },
                  { key: 'notify_admin_on_vip',       label: 'Alert on VIP visitor' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{label}</p>
                    <Toggle value={notifs[key as keyof typeof notifs] as boolean} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>
              <div className={CARD}>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Delivery Channel</p>
                {['sms','whatsapp','email','all'].map(m => (
                  <label key={m} className="flex items-center gap-2 py-1.5 cursor-pointer">
                    <input type="radio" name="notify_method" value={m} checked={notifs.notify_method === m} onChange={() => setNotifs(n => ({ ...n, notify_method: m }))} className="accent-brand-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{m === 'all' ? 'All channels' : m.toUpperCase()}</span>
                  </label>
                ))}
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Contact your account manager</span> to change modules, OTP requirements, form fields, security policies, or resource limits.
                </p>
              </div>
              <button onClick={saveNotifications} disabled={savingN} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50">
                {savingN ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Notifications
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
