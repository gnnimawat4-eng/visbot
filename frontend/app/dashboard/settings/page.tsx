'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, Save, Upload, Building2, Zap, Palette, Tag, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'

interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
  active: boolean
  created_at: string
}

const PLAN_BADGES: Record<string, { label: string; color: string }> = {
  starter:    { label: 'Starter',    color: 'bg-gray-100 text-gray-600' },
  pro:        { label: 'Pro',        color: 'bg-brand-50 text-brand-600' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-50 text-purple-600' },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [company, setCompany]   = useState<Company | null>(null)
  const [loading, setLoading]   = useState(true)
  const [name, setName]         = useState('')
  const [logoUrl, setLogoUrl]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [isNew, setIsNew]       = useState(false)
  const [newSlug, setNewSlug]   = useState('')

  useEffect(() => {
    fetch('/api/dashboard/company')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.id) {
          setCompany(d)
          setName(d.name)
          setLogoUrl(d.logo_url ?? '')
        } else {
          setIsNew(true)
        }
        setLoading(false)
      })
      .catch(() => { setIsNew(true); setLoading(false) })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (isNew) {
        const res = await fetch('/api/dashboard/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug: newSlug }),
        })
        const data = await res.json()
        if (data.id) { setCompany(data); setIsNew(false); toast.success('Company created!') }
        else toast.error(data.error ?? 'Failed')
      } else {
        const res = await fetch('/api/dashboard/company', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: company!.id, name, logo_url: logoUrl || null }),
        })
        const data = await res.json()
        if (data.id) { setCompany(data); toast.success('Saved!') }
        else toast.error(data.error ?? 'Failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const plan = company?.plan ?? 'starter'
  const badge = PLAN_BADGES[plan] ?? PLAN_BADGES.starter

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-2xl">
        <div className="h-6 w-32 bg-gray-100 rounded" />
        <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your company profile</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Plan badge */}
        {company && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                <Zap size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Current plan</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Member since {new Date(company.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
          </div>
        )}

        {/* Company profile form */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Company profile</h2>
          </div>

          <div className="space-y-4">
            <Field label="Company name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </Field>

            {isNew && (
              <Field label="Subdomain slug">
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
                  <input
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="acme"
                    className="flex-1 px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">.visbot.in</span>
                </div>
              </Field>
            )}

            {!isNew && (
              <Field label="Subdomain">
                <div className="flex items-center border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                  <span className="flex-1 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{company?.slug}</span>
                  <span className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 border-l border-gray-200 dark:border-gray-700">.visbot.in</span>
                </div>
              </Field>
            )}

            <Field label="Logo URL">
              <div className="flex gap-2">
                <input
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo preview" className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Upload size={11} /> Paste a public image URL. Cloudinary / Supabase Storage upload coming soon.
              </p>
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div />
            <button
              onClick={save}
              disabled={saving || !name.trim() || (isNew && !newSlug.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              <Save size={15} />
              {saving ? 'Saving…' : isNew ? 'Create company' : 'Save changes'}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette size={18} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Auto follows your system setting</p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Feature settings */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={18} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Feature settings</h2>
          </div>
          <div className="space-y-2">
            {[
              { href: '/dashboard/settings/categories', icon: Tag, label: 'Material Categories', desc: 'Manage categories, approval rules, and photo requirements' },
              { href: '/dashboard/settings/reports', icon: BarChart2, label: 'Daily Reports', desc: 'Configure scheduled digest recipients and content' },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* ENV reminder */}
        {!process.env.NEXT_PUBLIC_COMPANY_ID && company && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Set NEXT_PUBLIC_COMPANY_ID</p>
            <p className="text-xs">Add to <code className="font-mono">frontend/.env.local</code>:</p>
            <code className="block mt-1 font-mono text-xs bg-amber-100 px-2 py-1 rounded">
              NEXT_PUBLIC_COMPANY_ID={company.id}
            </code>
            <p className="text-xs mt-1">Then restart the dev server so stats and feeds are scoped to your company.</p>
          </div>
        )}
      </div>
    </>
  )
}
