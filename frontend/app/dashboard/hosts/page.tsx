'use client'
import { useEffect, useState } from 'react'
import { Plus, Loader2, Pencil, Trash2, Phone, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Modal } from '@/components/dashboard/Modal'

interface Host {
  id: string; full_name: string; phone: string | null; email: string | null
  department: string | null; active: boolean; created_at: string
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
const EMPTY = { full_name: '', phone: '', email: '', department: '' }

export default function HostsPage() {
  const [hosts,    setHosts]    = useState<Host[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'add' | 'edit' | null>(null)
  const [editing,  setEditing]  = useState<Host | null>(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/hosts')
      .then(r => r.json())
      .then(d => { setHosts(d.hosts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setModal('add') }
  const openEdit = (h: Host) => {
    setForm({ full_name: h.full_name, phone: h.phone ?? '', email: h.email ?? '', department: h.department ?? '' })
    setEditing(h); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditing(null); setForm(EMPTY) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        const res  = await fetch('/api/dashboard/hosts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
        setHosts(prev => [data, ...prev])
        toast.success(`${form.full_name} added as host`)
      } else if (editing) {
        const res  = await fetch(`/api/dashboard/hosts/${editing.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
        setHosts(prev => prev.map(h => h.id === editing.id ? { ...h, ...data } : h))
        toast.success('Host updated')
      }
      closeModal()
    } finally { setSaving(false) }
  }

  const deleteHost = async (h: Host) => {
    if (!confirm(`Remove ${h.full_name}?`)) return
    setDeleting(h.id)
    const res = await fetch(`/api/dashboard/hosts/${h.id}`, { method: 'DELETE' })
    if (res.ok) {
      setHosts(prev => prev.filter(x => x.id !== h.id))
      toast.success('Host removed')
    } else toast.error('Failed')
    setDeleting(null)
  }

  const noPhoneCount = hosts.filter(h => !h.phone).length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hosts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{hosts.length} host{hosts.length !== 1 ? 's' : ''} · receive exit notifications</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
          <Plus size={15} /> Add Host
        </button>
      </div>

      {/* Warning: hosts without phone */}
      {noPhoneCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 text-sm text-amber-800">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
          <span><strong>{noPhoneCount}</strong> host{noPhoneCount > 1 ? 's have' : ' has'} no phone number — they won&apos;t receive exit SMS notifications.</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {['Name', 'Phone', 'Email', 'Department', 'Added', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td>
                </tr>
              ))
            ) : hosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Phone size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-2">No hosts yet.</p>
                  <button onClick={openAdd} className="text-xs text-brand-500 hover:underline">Add your first host →</button>
                </td>
              </tr>
            ) : (
              hosts.map(h => (
                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                        {h.full_name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{h.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {h.phone
                      ? <span className="text-gray-600 dark:text-gray-300 font-mono text-xs">{h.phone}</span>
                      : <span className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle size={11} /> No phone</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{h.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{h.department ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{format(new Date(h.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(h)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteHost(h)} disabled={deleting === h.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {deleting === h.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal === 'add' ? 'Add Host' : 'Edit Host'}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name *</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Arjun Mehta" className={INPUT} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone <span className="text-amber-600 text-xs font-normal">(required for SMS notifications)</span>
            </label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210" className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="arjun@company.com" className={INPUT} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
            <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              placeholder="Engineering, HR, Sales…" className={INPUT} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeModal}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : modal === 'add' ? 'Add Host' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
