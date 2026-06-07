'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle,
  UserCheck, Users, Package, Truck,
  ToggleLeft, ToggleRight,
  Plus, Copy, Check, Loader2, Trash2, UserCog,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatTime } from '@/lib/utils'
import { Modal } from '@/components/dashboard/Modal'

interface Company { id: string; name: string; slug: string; plan: string; active: boolean; logo_url: string | null; created_at: string }
interface UserRow  { id: string; full_name: string | null; email: string | null; phone: string | null; role: string; active: boolean; created_at: string }
interface CheckInRow { id: string; purpose: string; host_name: string; status: string; created_at: string; visitor: { name: string; phone: string } | null }
interface PassRow    { id: string; pass_number: string; pass_type: string; vehicle_number: string; party_name: string; status: string; checked_in_at: string }

interface PageData {
  company: Company; users: UserRow[]
  checkinsToday: number; totalCheckins: number
  gatePassesToday: number; materialsOut: number
  recentCheckins: CheckInRow[]; recentPasses: PassRow[]
}

const PLAN_COLOR: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600', pro: 'bg-brand-50 text-brand-600', enterprise: 'bg-purple-50 text-purple-600',
}
const PLANS = ['starter', 'pro', 'enterprise']
const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data,    setData]    = useState<PageData | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [planSel, setPlanSel] = useState('')

  // Add Admin modal
  const [adminModal,  setAdminModal]  = useState(false)
  const [adminForm,   setAdminForm]   = useState({ full_name: '', email: '', phone: '' })
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminCreds,  setAdminCreds]  = useState<{ email: string; password: string; name: string } | null>(null)
  const [copied,      setCopied]      = useState(false)

  // Remove admin
  const [removingAdmin, setRemovingAdmin] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/owner/companies/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setPlanSel(d.company?.plan ?? 'starter') })
      .catch(() => {})
  }, [id])

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setSaving(true)
    const res = await fetch(`/api/owner/companies/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setData(d => d ? { ...d, company: updated } : d)
      toast.success(msg)
    } else toast.error('Failed')
    setSaving(false)
  }

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminForm.full_name.trim() || !adminForm.email.trim()) {
      toast.error('Name and email are required'); return
    }
    setAdminSaving(true)
    const res  = await fetch(`/api/owner/companies/${id}/admin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminForm),
    })
    const json = await res.json()
    setAdminSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed'); return }

    // Refresh data to show new admin
    fetch(`/api/owner/companies/${id}`).then(r => r.json()).then(d => setData(d)).catch(() => {})
    setAdminModal(false)
    setAdminForm({ full_name: '', email: '', phone: '' })
    setAdminCreds({ email: json.email, password: json.tempPassword, name: json.admin.full_name })
  }

  const removeAdmin = async (adminId: string) => {
    if (!confirm('Remove this admin? They will lose access immediately.')) return
    setRemovingAdmin(true)
    const res = await fetch(`/api/owner/companies/${id}/admin`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    })
    if (res.ok) {
      setData(d => d ? { ...d, users: d.users.filter(u => u.id !== adminId) } : d)
      toast.success('Admin removed')
    } else toast.error('Failed')
    setRemovingAdmin(false)
  }

  const copyAdminCreds = () => {
    if (!adminCreds) return
    navigator.clipboard.writeText(
      `VisBot Admin Credentials\nEmail: ${adminCreds.email}\nPassword: ${adminCreds.password}\nLogin: ${window.location.origin}/login`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!data) {
    return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
  }

  const { company, users, checkinsToday, totalCheckins, gatePassesToday, materialsOut, recentCheckins, recentPasses } = data
  const admin  = users.find(u => u.role === 'admin')
  const guards = users.filter(u => u.role === 'guard')

  return (
    <>
      {/* Admin credentials popup */}
      {adminCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <UserCog size={22} className="text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Admin Created!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">Share these credentials with {adminCreds.name}.</p>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 font-mono text-sm mb-4">
              <p><span className="text-gray-400 dark:text-gray-500">Email:</span> <strong className="text-gray-800 dark:text-gray-100">{adminCreds.email}</strong></p>
              <p><span className="text-gray-400 dark:text-gray-500">Password:</span> <strong className="text-brand-600">{adminCreds.password}</strong></p>
              <p><span className="text-gray-400 dark:text-gray-500 text-xs">Portal:</span> <span className="text-gray-500 dark:text-gray-400 text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/login</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyAdminCreds}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {copied ? <><Check size={13} className="text-green-500" /> Copied!</> : <><Copy size={13} /> Copy all</>}
              </button>
              <button onClick={() => setAdminCreds(null)}
                className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/companies" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{company.name}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">{company.slug}.visbot.in</p>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {/* Plan selector */}
          <div className="flex items-center gap-2">
            <select value={planSel} onChange={e => setPlanSel(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {planSel !== company.plan && (
              <button onClick={() => patch({ plan: planSel }, 'Plan updated')} disabled={saving}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
                Save
              </button>
            )}
          </div>
          <button onClick={() => patch({ active: !company.active }, company.active ? 'Deactivated' : 'Activated')}
            disabled={saving}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
              company.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}>
            {company.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {company.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Checkins today',    value: checkinsToday,   icon: UserCheck, accent: true  },
          { label: 'Total checkins',    value: totalCheckins,   icon: Users,     accent: false },
          { label: 'Gate passes today', value: gatePassesToday, icon: Truck,     accent: false },
          { label: 'Materials out',     value: materialsOut,    icon: Package,   accent: false },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <Icon size={14} className={accent ? 'text-brand-500' : 'text-gray-300 dark:text-gray-600'} />
            </div>
            <p className={`text-2xl font-bold ${accent ? 'text-brand-500' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Admin section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</p>
            {!admin && (
              <button onClick={() => setAdminModal(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                <Plus size={12} /> Add Admin
              </button>
            )}
          </div>
          <div className="p-5">
            {admin ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-sm font-bold text-brand-600 flex-shrink-0">
                  {(admin.full_name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{admin.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{admin.email ?? '—'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{admin.phone ?? 'no phone'}</p>
                </div>
                <button onClick={() => removeAdmin(admin.id)} disabled={removingAdmin}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove admin">
                  {removingAdmin ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <UserCog size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-3">No admin assigned</p>
                <button onClick={() => setAdminModal(true)}
                  className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                  + Add Admin
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Guards */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guards ({guards.length})</p>
          </div>
          {guards.length === 0
            ? <p className="px-5 py-8 text-sm text-gray-400 dark:text-gray-500 text-center">No guards yet — admin adds them from their portal.</p>
            : <ul className="divide-y divide-gray-50 dark:divide-gray-800 max-h-48 overflow-y-auto">
                {guards.map(g => (
                  <li key={g.id} className="px-5 py-2.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {(g.full_name ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{g.full_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{g.email ?? g.phone ?? '—'}</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${g.active ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                      {g.active ? 'On' : 'Off'}
                    </span>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <UserCheck size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent check-ins</h2>
          </div>
          {recentCheckins.length === 0
            ? <p className="px-5 py-8 text-sm text-gray-400 dark:text-gray-500 text-center">No check-ins yet</p>
            : <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentCheckins.map(c => (
                  <li key={c.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.visitor?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{c.purpose} · {c.host_name} · {formatTime(c.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === 'checked_in' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status === 'checked_in' ? 'In' : 'Out'}
                    </span>
                  </li>
                ))}
              </ul>
          }
        </div>

        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Truck size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Recent gate passes</h2>
          </div>
          {recentPasses.length === 0
            ? <p className="px-5 py-8 text-sm text-gray-400 text-center">No gate passes yet</p>
            : <ul className="divide-y divide-gray-50">
                {recentPasses.map(p => (
                  <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${p.pass_type === 'inward' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      {p.pass_type === 'inward'
                        ? <ArrowDownCircle size={12} className="text-emerald-500" />
                        : <ArrowUpCircle   size={12} className="text-amber-500"   />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">{p.vehicle_number}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.party_name} · {formatTime(p.checked_in_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.status === 'inside' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">Company created {format(new Date(company.created_at), 'dd MMM yyyy')}</p>

      {/* Add Admin Modal */}
      <Modal open={adminModal} onClose={() => setAdminModal(false)} title="Add Company Admin">
        <form onSubmit={createAdmin} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
            This person will manage <strong>{company.name}</strong> — they can add guards and view all company data.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name *</label>
            <input value={adminForm.full_name} onChange={e => setAdminForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Arjun Mehta" className={INPUT} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
            <input type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@company.com" className={INPUT} required />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Used to log in at /login</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
            <input value={adminForm.phone} onChange={e => setAdminForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210" className={INPUT} />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
            A temporary password will be generated. Share it with the admin.
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setAdminModal(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={adminSaving}
              className="flex-1 px-4 py-2 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {adminSaving ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
