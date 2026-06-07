'use client'
import { useEffect, useState } from 'react'
import { Plus, Loader2, Shield, ToggleLeft, ToggleRight, Trash2, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Modal } from '@/components/dashboard/Modal'

interface Guard {
  id: string; full_name: string | null; email: string | null; phone: string | null; active: boolean; created_at: string
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'

export default function GuardsPage() {
  const [guards,    setGuards]    = useState<Guard[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [toggling,  setToggling]  = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  // Form
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })

  // Created credentials to show
  const [creds,     setCreds]     = useState<{ email: string; password: string } | null>(null)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/guards')
      .then(r => r.json())
      .then(d => { setGuards(d.guards ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addGuard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email are required'); return
    }
    setSaving(true)
    const res  = await fetch('/api/dashboard/guards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    setGuards(prev => [data.guard, ...prev])
    setCreds({ email: data.email, password: data.tempPassword })
    setForm({ full_name: '', email: '', phone: '' })
    setModalOpen(false)
  }

  const toggleActive = async (g: Guard) => {
    setToggling(g.id)
    const res = await fetch(`/api/dashboard/guards/${g.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !g.active }),
    })
    if (res.ok) {
      setGuards(prev => prev.map(x => x.id === g.id ? { ...x, active: !g.active } : x))
      toast.success(g.active ? 'Guard deactivated' : 'Guard activated')
    }
    setToggling(null)
  }

  const deleteGuard = async (g: Guard) => {
    if (!confirm(`Remove guard ${g.full_name}? This cannot be undone.`)) return
    setDeleting(g.id)
    const res = await fetch(`/api/dashboard/guards/${g.id}`, { method: 'DELETE' })
    if (res.ok) {
      setGuards(prev => prev.filter(x => x.id !== g.id))
      toast.success('Guard removed')
    } else toast.error('Failed to remove')
    setDeleting(null)
  }

  const copyCreds = () => {
    if (!creds) return
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}\nLogin: ${window.location.origin}/login`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Credentials modal */}
      {creds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Shield size={22} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Guard Added!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">Share these credentials with the guard.</p>

            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 font-mono text-sm mb-4">
              <p><span className="text-gray-400 dark:text-gray-500">Email:</span> <strong className="text-gray-800 dark:text-gray-100">{creds.email}</strong></p>
              <p><span className="text-gray-400 dark:text-gray-500">Password:</span> <strong className="text-brand-600">{creds.password}</strong></p>
              <p><span className="text-gray-400 dark:text-gray-500">Login:</span> <span className="text-gray-600 dark:text-gray-400 text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/login</span></p>
            </div>

            <div className="flex gap-3">
              <button onClick={copyCreds}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {copied ? <><Check size={14} className="text-green-500" /> Copied!</> : <><Copy size={14} /> Copy all</>}
              </button>
              <button onClick={() => setCreds(null)}
                className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Guards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{guards.length} guard{guards.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
          <Plus size={15} /> Add Guard
        </button>
      </div>

      {/* Guards table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {['Guard', 'Email', 'Phone', 'Status', 'Added', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading
              ? [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td>
                  </tr>
                ))
              : guards.length === 0
                ? <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Shield size={28} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No guards yet. Add one to get started.</p>
                    </td>
                  </tr>
                : guards.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                            {(g.full_name ?? '?')[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{g.full_name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{g.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{g.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {g.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{format(new Date(g.created_at), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleActive(g)} disabled={toggling === g.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            title={g.active ? 'Deactivate' : 'Activate'}>
                            {toggling === g.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : g.active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />
                            }
                          </button>
                          <button onClick={() => deleteGuard(g)} disabled={deleting === g.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                            title="Remove guard">
                            {deleting === g.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {/* Add Guard Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Guard">
        <form onSubmit={addGuard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name *</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Ramesh Kumar" className={INPUT} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="ramesh@company.com" className={INPUT} required />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Guard will use this to log in.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210" className={INPUT} />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
            A temporary password will be generated. Share it with the guard so they can log in.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Add Guard'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
