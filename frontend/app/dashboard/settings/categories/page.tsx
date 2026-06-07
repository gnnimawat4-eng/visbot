'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string; name: string; icon: string | null; color: string | null
  requires_approval: boolean; requires_photo: boolean; requires_value: boolean
  value_threshold_inr: number | null; allowed_directions: string[]
  is_active: boolean; sort_order: number
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
const BLANK: Omit<Category, 'id' | 'is_active'> = {
  name: '', icon: '📦', color: '#16A34A',
  requires_approval: false, requires_photo: true, requires_value: false,
  value_threshold_inr: null, allowed_directions: ['in','out'], sort_order: 0,
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative flex-shrink-0" onClick={() => onChange(!checked)}>
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  )
}

export default function CategoriesPage() {
  const [cats, setCats]         = useState<Category[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...BLANK })
  const [editing, setEditing]   = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  function loadCats() {
    fetch('/api/categories').then(r => r.json()).then(d => { setCats(d.categories ?? []); setLoading(false) })
  }
  useEffect(loadCats, [])

  const setF = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  function startEdit(cat: Category) {
    setForm({ name: cat.name, icon: cat.icon ?? '', color: cat.color ?? '#16A34A', requires_approval: cat.requires_approval, requires_photo: cat.requires_photo, requires_value: cat.requires_value, value_threshold_inr: cat.value_threshold_inr, allowed_directions: cat.allowed_directions, sort_order: cat.sort_order })
    setEditing(cat.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name) return toast.error('Name required')
    setSaving(true)
    try {
      const url = editing ? `/api/categories/${editing}` : '/api/categories'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? 'Category updated' : 'Category added')
      setShowForm(false); setEditing(null); setForm({ ...BLANK }); loadCats()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this category?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    toast.success('Category removed'); loadCats()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Material Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Define categories with approval rules and restrictions</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ...BLANK }) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--vb-accent)' }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Category' : 'New Category'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icon (emoji)</label>
              <input value={form.icon ?? ''} onChange={e => setF('icon', e.target.value)} placeholder="📦" className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category Name *</label>
              <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Electronics" className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color ?? '#16A34A'} onChange={e => setF('color', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                <input value={form.color ?? ''} onChange={e => setF('color', e.target.value)} placeholder="#16A34A" className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Value Threshold (₹) for Approval</label>
              <input type="number" value={form.value_threshold_inr ?? ''} onChange={e => setF('value_threshold_inr', e.target.value ? +e.target.value : null)} placeholder="e.g. 50000" className={INPUT} />
            </div>
          </div>
          <div className="space-y-3">
            <Toggle checked={form.requires_approval} onChange={v => setF('requires_approval', v)} label="Requires admin approval (for all items)" />
            <Toggle checked={form.requires_photo} onChange={v => setF('requires_photo', v)} label="Requires photo proof" />
            <Toggle checked={form.requires_value} onChange={v => setF('requires_value', v)} label="Requires value declaration" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: '#16A34A' }}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-6 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : (
        <div className="space-y-2">
          {cats.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center gap-4">
              <span className="text-2xl w-8 text-center">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color ?? '#aaa' }} />
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  {cat.requires_approval && <span className="flex items-center gap-0.5"><CheckCircle2 size={10} className="text-orange-500" /> Needs approval</span>}
                  {cat.requires_photo && <span className="flex items-center gap-0.5"><CheckCircle2 size={10} className="text-blue-500" /> Photo required</span>}
                  {cat.value_threshold_inr && <span className="flex items-center gap-0.5"><CheckCircle2 size={10} className="text-purple-500" /> Above ₹{cat.value_threshold_inr.toLocaleString()} needs approval</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
