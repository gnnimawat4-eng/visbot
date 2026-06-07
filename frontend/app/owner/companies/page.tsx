'use client'
import { useEffect, useState } from 'react'
import { Plus, ExternalLink, Shield, UserCheck, Settings } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Modal } from '@/components/dashboard/Modal'
import toast from 'react-hot-toast'

interface Company {
  id: string; name: string; slug: string; plan: string; active: boolean; created_at: string
  admin_name: string | null; admin_email: string | null; guards_count: number; checkins_today: number
  industry_template?: string
}

const TEMPLATE_ICONS: Record<string, string> = {
  office: '🏢', factory: '🏭', hospital: '🏥', school: '🏫',
  society: '🏠', hotel: '🏨', warehouse: '🏗️', custom: '⚙️',
}
const TEMPLATE_COLORS: Record<string, string> = {
  office:    'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  factory:   'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  hospital:  'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  school:    'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  society:   'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  hotel:     'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  warehouse: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  custom:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const PLAN_COLOR: Record<string, string> = {
  starter:    'bg-gray-100 text-gray-600',
  pro:        'bg-brand-50 text-brand-600',
  enterprise: 'bg-purple-50 text-purple-600',
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'

export default function OwnerCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form,      setForm]      = useState({ name: '', slug: '', plan: 'starter' })
  const [toggling,  setToggling]  = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/owner/companies')
      .then(r => r.json())
      .then(d => { setCompanies(d.companies ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggle = async (c: Company) => {
    setToggling(c.id)
    const res = await fetch(`/api/owner/companies/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    })
    if (res.ok) {
      setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, active: !c.active } : x))
      toast.success(c.active ? 'Company deactivated' : 'Company activated')
    }
    setToggling(null)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/owner/companies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setCompanies(prev => [{ ...data, admin_name: null, admin_email: null, guards_count: 0, checkins_today: 0 }, ...prev])
      setModalOpen(false)
      setForm({ name: '', slug: '', plan: 'starter' })
      toast.success('Company created')
    } else toast.error(data.error ?? 'Failed')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Companies</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{companies.length} tenant{companies.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors">
          <Plus size={15} /> New Company
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {['Company', 'Template', 'Plan', 'Admin', 'Guards', 'Today', 'Status', 'Created', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading
              ? [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td>
                  </tr>
                ))
              : companies.length === 0
                ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">No companies yet.</td></tr>
                : companies.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/owner/companies/${c.id}`}
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-brand-500 flex items-center gap-1">
                          {c.name} <ExternalLink size={11} className="text-gray-300 dark:text-gray-600" />
                        </Link>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{c.slug}.visbot.in</p>
                      </td>
                      <td className="px-4 py-3">
                        {c.industry_template
                          ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TEMPLATE_COLORS[c.industry_template] ?? TEMPLATE_COLORS.custom}`}>
                              {TEMPLATE_ICONS[c.industry_template] ?? '⚙️'} {c.industry_template}
                            </span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLOR[c.plan] ?? PLAN_COLOR.starter}`}>{c.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.admin_email
                          ? <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.admin_name ?? '—'}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{c.admin_email}</p>
                            </div>
                          : <span className="text-xs text-gray-400">No admin</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <Shield size={11} className="text-gray-400 dark:text-gray-500" /> {c.guards_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold">
                          <UserCheck size={11} /> {c.checkins_today}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/owner/companies/${c.id}/configure`}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            <Settings size={11} /> Configure
                          </Link>
                          <button onClick={() => toggle(c)} disabled={toggling === c.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">
                            {toggling === c.id ? '…' : c.active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Company">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Company name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" className={INPUT} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug (subdomain) *</label>
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') }))} placeholder="acme" className="flex-1 px-3 py-2 text-sm outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" required />
              <span className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">.visbot.in</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plan</label>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className={INPUT + ' bg-white'}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600">Create</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
