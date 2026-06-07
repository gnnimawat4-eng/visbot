'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400'
const LABEL = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

export default function NewBlacklistPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', phone: '', id_proof_number: '', reason: '', severity: 'medium', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.reason) { setError('Name and reason are required'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to add'); setSaving(false); return }
    router.push(`/dashboard/blacklist/${data.entry.id}`)
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add to Blacklist</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Block an individual from entering</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-4">
          <div>
            <label className={LABEL}>Full Name <span className="text-red-500">*</span></label>
            <input className={INPUT} placeholder="Person's full name" value={form.name} onChange={set('name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Phone</label>
              <input className={INPUT} placeholder="Mobile number" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className={LABEL}>ID Proof No.</label>
              <input className={INPUT} placeholder="Aadhar / PAN / etc." value={form.id_proof_number} onChange={set('id_proof_number')} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Reason <span className="text-red-500">*</span></label>
            <textarea className={INPUT + ' resize-none'} rows={2} placeholder="Why is this person blacklisted?" value={form.reason} onChange={set('reason')} />
          </div>
          <div>
            <label className={LABEL}>Severity</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, severity: s }))}
                  className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                    form.severity === s
                      ? s === 'low'      ? 'bg-blue-500 text-white border-blue-500'
                        : s === 'medium' ? 'bg-yellow-500 text-white border-yellow-500'
                        : s === 'high'   ? 'bg-orange-500 text-white border-orange-500'
                        :                  'bg-red-600 text-white border-red-600'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Additional Notes</label>
            <textarea className={INPUT + ' resize-none'} rows={2} placeholder="Optional details" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors">
            {saving ? 'Adding…' : 'Add to Blacklist'}
          </button>
        </div>
      </form>
    </div>
  )
}
