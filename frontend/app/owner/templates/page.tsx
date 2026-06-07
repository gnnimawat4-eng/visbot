'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, ChevronDown, ChevronUp, X, Check } from 'lucide-react'

interface Template {
  id: string; name: string; display_name: string
  description: string | null; icon: string | null
  is_default: boolean; config: Record<string, unknown>
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'

export default function TemplatesPage() {
  const [templates,  setTemplates]  = useState<Template[]>([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [creating,   setCreating]   = useState(false)
  const [form,       setForm]       = useState({ name: '', display_name: '', description: '', icon: '⚙️' })
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    fetch('/api/owner/templates')
      .then(r => r.json())
      .then(d => { setTemplates(d.templates ?? []); setLoading(false) })
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/owner/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, config: {} }),
    })
    const data = await res.json()
    if (res.ok) {
      setTemplates(prev => [...prev, data.template])
      setCreating(false)
      setForm({ name: '', display_name: '', description: '', icon: '⚙️' })
      toast.success('Template created')
    } else toast.error(data.error ?? 'Failed')
    setSaving(false)
  }

  const markDefault = async (name: string) => {
    const res = await fetch(`/api/owner/templates/${name}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    if (res.ok) {
      setTemplates(prev => prev.map(t => ({ ...t, is_default: t.name === name })))
      toast.success('Default template updated')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Industry Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Pre-built configurations applied when onboarding new companies.
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600">
          <Plus size={15} /> New Template
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="bg-white dark:bg-gray-900 border border-brand-200 dark:border-brand-700 rounded-lg p-5 mb-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">New Template</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slug (unique)</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s/g, '_') }))} className={INPUT} placeholder="e.g. pharma" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Display Name</label>
              <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} className={INPUT} placeholder="e.g. Pharma / Lab" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Icon (emoji)</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className={INPUT} maxLength={4} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={INPUT} placeholder="Brief description…" />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Config can be edited via JSON after creation by patching the template.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Template'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading
          ? [1,2,3].map(i => <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 animate-pulse h-20" />)
          : templates.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(e => e === t.name ? null : t.name)}>
                <span className="text-2xl">{t.icon ?? '⚙️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.display_name}</p>
                    {t.is_default && (
                      <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 rounded-full font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.description ?? 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!t.is_default && (
                    <button onClick={e => { e.stopPropagation(); markDefault(t.name) }}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      Set default
                    </button>
                  )}
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">{t.name}</span>
                  {expanded === t.name ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>
              {expanded === t.name && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-5 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Config overrides</p>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-72 font-mono whitespace-pre-wrap">
                    {JSON.stringify(t.config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </>
  )
}
