'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500'
const LABEL = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

const PURPOSES = ['Meeting', 'Delivery', 'Interview', 'Official', 'Other']

export default function NewInvitationPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    visitor_name: '', visitor_phone: '', visitor_email: '',
    host_name: '', purpose: 'Meeting', scheduled_date: '', scheduled_time: '',
    notes: '', valid_hours: '24',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.visitor_name || !form.visitor_phone || !form.host_name || !form.scheduled_date) {
      setError('Please fill all required fields')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valid_hours: Number(form.valid_hours),
        purpose: form.purpose.toLowerCase(),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create'); setSaving(false); return }
    router.push(`/dashboard/invitations/${data.invitation.id}`)
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Invitation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create a pre-approved entry with QR code</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Visitor Details</h2>

          <div>
            <label className={LABEL}>Full Name <span className="text-red-500">*</span></label>
            <input className={INPUT} placeholder="Visitor name" value={form.visitor_name} onChange={set('visitor_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Phone <span className="text-red-500">*</span></label>
              <input className={INPUT} placeholder="10-digit mobile" value={form.visitor_phone} onChange={set('visitor_phone')} />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input className={INPUT} placeholder="Optional" type="email" value={form.visitor_email} onChange={set('visitor_email')} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Visit Details</h2>

          <div>
            <label className={LABEL}>Host Name <span className="text-red-500">*</span></label>
            <input className={INPUT} placeholder="Who are they visiting?" value={form.host_name} onChange={set('host_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Purpose</label>
              <select className={INPUT} value={form.purpose} onChange={set('purpose')}>
                {PURPOSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Valid For (hours)</label>
              <select className={INPUT} value={form.valid_hours} onChange={set('valid_hours')}>
                {['2', '4', '8', '12', '24', '48', '72'].map(h => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Date <span className="text-red-500">*</span></label>
              <input type="date" className={INPUT} value={form.scheduled_date} onChange={set('scheduled_date')} />
            </div>
            <div>
              <label className={LABEL}>Time</label>
              <input type="time" className={INPUT} value={form.scheduled_time} onChange={set('scheduled_time')} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Notes</label>
            <textarea className={INPUT + ' resize-none'} rows={2} placeholder="Any special instructions" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
            {saving ? 'Creating…' : 'Create & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  )
}
