'use client'
import { useEffect, useState } from 'react'
import { Mail, MessageSquare, Save, Send, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Settings {
  daily_email_enabled: boolean; daily_whatsapp_enabled: boolean
  weekly_summary_enabled: boolean; monthly_report_enabled: boolean
  email_recipients: string[]; whatsapp_recipients: string[]
  daily_send_hour: number; daily_send_minute: number
  weekly_day: number; monthly_day: number
  include_visitor_stats: boolean; include_material_stats: boolean
  include_pending_returns: boolean; include_top_hosts: boolean
  include_blacklist_attempts: boolean; include_expected_tomorrow: boolean
}

interface Preview {
  date: string; total_visitors: number; currently_inside: number
  materials_in: number; materials_out: number; pending_returns: number
  top_hosts: { name: string; count: number }[]
}

const DEFAULT: Settings = {
  daily_email_enabled: true, daily_whatsapp_enabled: false,
  weekly_summary_enabled: true, monthly_report_enabled: true,
  email_recipients: [], whatsapp_recipients: [],
  daily_send_hour: 18, daily_send_minute: 0,
  weekly_day: 1, monthly_day: 1,
  include_visitor_stats: true, include_material_stats: true,
  include_pending_returns: true, include_top_hosts: true,
  include_blacklist_attempts: true, include_expected_tomorrow: true,
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div className="relative flex-shrink-0" onClick={() => onChange(!checked)}>
        <div className={`w-10 h-5 rounded-full transition-colors`} style={{ background: checked ? 'var(--vb-accent)' : 'var(--vb-border)' }} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  )
}

function ChipInput({ values, onChange, placeholder, type = 'text' }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; type?: string }) {
  const [input, setInput] = useState('')
  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 px-2.5 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-lg text-sm">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="ml-0.5 hover:text-red-500">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type={type} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        <button onClick={add} className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">Add</button>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Icon size={16} className="text-brand-500" /> {title}
      </h2>
      {children}
    </div>
  )
}

export default function ReportsSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [preview, setPreview]   = useState<Preview | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [testing, setTesting]   = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/settings').then(r => r.json()),
      fetch('/api/reports/preview').then(r => r.json()),
    ]).then(([sd, pd]) => {
      if (sd.settings) setSettings({ ...DEFAULT, ...sd.settings })
      setPreview(pd)
      setLoading(false)
    })
  }, [])

  const set = (k: keyof Settings, v: unknown) => setSettings(s => ({ ...s, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/reports/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Settings saved')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setSaving(false) }
  }

  async function sendTest() {
    setTesting(true)
    const res = await fetch('/api/reports/test', { method: 'POST' })
    const d = await res.json()
    if (res.ok) toast.success(d.message)
    else toast.error('Failed to send test report')
    setTesting(false)
  }

  if (loading) return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure daily email and WhatsApp reports</p>
        </div>
        <button onClick={sendTest} disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          {testing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          Send Test
        </button>
      </div>

      {/* Preview card */}
      {preview && (
        <div className="rounded-lg p-5" style={{ background: 'var(--vb-bg-card)', border: '1px solid var(--vb-border)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--vb-text-3)' }}>Today's Snapshot — {new Date(preview.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Visitors', value: preview.total_visitors },
              { label: 'Inside', value: preview.currently_inside },
              { label: 'Materials In', value: preview.materials_in },
              { label: 'Pending Returns', value: preview.pending_returns },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--vb-bg-hover)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--vb-text)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--vb-text-3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {preview.top_hosts.length > 0 && (
            <div className="mt-3 text-sm" style={{ color: 'var(--vb-text-2)' }}>
              Top host: <span className="font-semibold">{preview.top_hosts[0].name}</span> ({preview.top_hosts[0].count} visitors)
            </div>
          )}
        </div>
      )}

      <Section title="Email Reports" icon={Mail}>
        <Toggle checked={settings.daily_email_enabled} onChange={v => set('daily_email_enabled', v)} label="Enable daily email report" />
        <Toggle checked={settings.weekly_summary_enabled} onChange={v => set('weekly_summary_enabled', v)} label="Weekly summary (Monday)" />
        <Toggle checked={settings.monthly_report_enabled} onChange={v => set('monthly_report_enabled', v)} label="Monthly report (1st of month)" />
        {settings.daily_email_enabled && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Send time</label>
              <div className="flex items-center gap-2">
                <select value={settings.daily_send_hour} onChange={e => set('daily_send_hour', +e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {[6,7,8,9,10,18,19,20,21].map(h => <option key={h} value={h}>{h}:00 {h < 12 ? 'AM' : 'PM'}</option>)}
                </select>
                <span className="text-gray-500 dark:text-gray-400 text-sm">IST</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Recipients (press Enter to add)</label>
              <ChipInput type="email" values={settings.email_recipients} onChange={v => set('email_recipients', v)} placeholder="admin@company.com" />
            </div>
          </div>
        )}
      </Section>

      <Section title="WhatsApp Reports" icon={MessageSquare}>
        <Toggle checked={settings.daily_whatsapp_enabled} onChange={v => set('daily_whatsapp_enabled', v)} label="Enable daily WhatsApp report" />
        {settings.daily_whatsapp_enabled && (
          <div className="mt-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Recipients (press Enter to add)</label>
            <ChipInput type="tel" values={settings.whatsapp_recipients} onChange={v => set('whatsapp_recipients', v)} placeholder="+919876543210" />
          </div>
        )}
      </Section>

      <Section title="Report Content" icon={RefreshCw}>
        <div className="space-y-0.5">
          <Toggle checked={settings.include_visitor_stats} onChange={v => set('include_visitor_stats', v)} label="Visitor statistics" />
          <Toggle checked={settings.include_material_stats} onChange={v => set('include_material_stats', v)} label="Material movement" />
          <Toggle checked={settings.include_pending_returns} onChange={v => set('include_pending_returns', v)} label="Pending material returns" />
          <Toggle checked={settings.include_top_hosts} onChange={v => set('include_top_hosts', v)} label="Top hosts" />
          <Toggle checked={settings.include_blacklist_attempts} onChange={v => set('include_blacklist_attempts', v)} label="Blacklist attempts" />
          <Toggle checked={settings.include_expected_tomorrow} onChange={v => set('include_expected_tomorrow', v)} label="Tomorrow's expected visitors" />
        </div>
      </Section>

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: 'var(--vb-accent)' }}>
        <Save size={16} />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
