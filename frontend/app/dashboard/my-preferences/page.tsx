'use client'
import { useEffect, useState } from 'react'
import { Save, Plane, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Prefs {
  channel_whatsapp: boolean; channel_sms: boolean; channel_email: boolean; channel_slack: boolean
  slack_webhook: string | null; email_override: string | null
  notify_on_visitor_arrival: boolean; notify_on_visitor_exit: boolean
  notify_on_material_for_me: boolean; notify_on_approval_required: boolean
  notify_on_blacklist_attempt: boolean
  quiet_hours_enabled: boolean; quiet_hours_start: string; quiet_hours_end: string
  quiet_days: string[]
  auto_approve_returning: boolean
  out_of_office: boolean; ooo_until: string | null; ooo_backup_host_id: string | null; ooo_message: string | null
}

const DEFAULT: Prefs = {
  channel_whatsapp: true, channel_sms: true, channel_email: false, channel_slack: false,
  slack_webhook: null, email_override: null,
  notify_on_visitor_arrival: true, notify_on_visitor_exit: false,
  notify_on_material_for_me: true, notify_on_approval_required: true, notify_on_blacklist_attempt: false,
  quiet_hours_enabled: false, quiet_hours_start: '22:00', quiet_hours_end: '07:00',
  quiet_days: [],
  auto_approve_returning: false,
  out_of_office: false, ooo_until: null, ooo_backup_host_id: null, ooo_message: null,
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-2">
      <div className="relative flex-shrink-0 mt-0.5" onClick={() => onChange(!checked)}>
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}  />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-1">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
      {children}
    </div>
  )
}

const DAYS = ['mon','tue','wed','thu','fri','sat','sun']
const DAY_LABELS: Record<string, string> = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }

export default function MyPreferencesPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    fetch('/api/preferences/me').then(r => r.json()).then(d => {
      if (d.preferences) setPrefs({ ...DEFAULT, ...d.preferences })
      setLoading(false)
    })
  }, [])

  const set = (k: keyof Prefs, v: unknown) => setPrefs(p => ({ ...p, [k]: v }))
  const toggleDay = (day: string) => {
    setPrefs(p => ({
      ...p,
      quiet_days: p.quiet_days.includes(day) ? p.quiet_days.filter(d => d !== day) : [...p.quiet_days, day]
    }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/preferences/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Preferences saved')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  async function clearOOO() {
    await fetch('/api/preferences/me/back', { method: 'POST' })
    set('out_of_office', false); set('ooo_until', null); set('ooo_message', null)
    toast.success('Marked as back in office')
  }

  if (loading) return (
    <div className="space-y-4 max-w-xl mx-auto">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}
    </div>
  )

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Preferences</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Notification and availability settings</p>
        </div>
      </div>

      {/* OOO Banner */}
      {prefs.out_of_office && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
          <Plane size={18} className="text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">You are marked Out of Office</p>
            {prefs.ooo_until && <p className="text-sm text-amber-700 dark:text-amber-400">Until {new Date(prefs.ooo_until).toLocaleDateString('en-IN')}</p>}
          </div>
          <button onClick={clearOOO} className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline">Mark Back</button>
        </div>
      )}

      <Section title="📱 Notification Channels">
        <Toggle checked={prefs.channel_whatsapp} onChange={v => set('channel_whatsapp', v)} label="WhatsApp" description="Send notifications via WhatsApp" />
        <Toggle checked={prefs.channel_sms} onChange={v => set('channel_sms', v)} label="SMS" description="Send SMS for visitor arrivals" />
        <Toggle checked={prefs.channel_email} onChange={v => set('channel_email', v)} label="Email" description="Send email notifications" />
        <Toggle checked={prefs.channel_slack} onChange={v => set('channel_slack', v)} label="Slack" description="Send to Slack webhook" />
        {prefs.channel_slack && (
          <input value={prefs.slack_webhook ?? ''} onChange={e => set('slack_webhook', e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="mt-2 w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        )}
      </Section>

      <Section title="🔔 Event Notifications">
        <Toggle checked={prefs.notify_on_visitor_arrival} onChange={v => set('notify_on_visitor_arrival', v)} label="Visitor arrives for me" />
        <Toggle checked={prefs.notify_on_visitor_exit} onChange={v => set('notify_on_visitor_exit', v)} label="Visitor leaves" />
        <Toggle checked={prefs.notify_on_material_for_me} onChange={v => set('notify_on_material_for_me', v)} label="Material received for me" />
        <Toggle checked={prefs.notify_on_approval_required} onChange={v => set('notify_on_approval_required', v)} label="Approval request (admin)" />
        <Toggle checked={prefs.notify_on_blacklist_attempt} onChange={v => set('notify_on_blacklist_attempt', v)} label="Blacklist attempt detected" />
      </Section>

      <Section title="🌙 Quiet Hours">
        <Toggle checked={prefs.quiet_hours_enabled} onChange={v => set('quiet_hours_enabled', v)} label="Enable quiet hours" description="No non-urgent notifications during these times" />
        {prefs.quiet_hours_enabled && (
          <div className="flex items-center gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
              <input type="time" value={prefs.quiet_hours_start} onChange={e => set('quiet_hours_start', e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
            <span className="text-gray-500 dark:text-gray-400 mt-4">to</span>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
              <input type="time" value={prefs.quiet_hours_end} onChange={e => set('quiet_hours_end', e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
          </div>
        )}
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quiet Days</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(d => (
              <button key={d} onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${prefs.quiet_days.includes(d) ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="✈️ Out of Office">
        <Toggle checked={prefs.out_of_office} onChange={v => set('out_of_office', v)} label="Mark me as Out of Office" description="Redirect visitor notifications to backup host" />
        {prefs.out_of_office && (
          <div className="space-y-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Out until</label>
              <input type="date" value={prefs.ooo_until ?? ''} onChange={e => set('ooo_until', e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">OOO Message (shown to guard)</label>
              <textarea value={prefs.ooo_message ?? ''} onChange={e => set('ooo_message', e.target.value)} rows={2}
                placeholder="e.g. On leave, please contact Priya Sharma"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none" />
            </div>
          </div>
        )}
      </Section>

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: 'var(--vb-accent)' }}>
        <Save size={16} />
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  )
}
