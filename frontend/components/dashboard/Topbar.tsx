'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { onMenuClick?: () => void }

export function Topbar({ onMenuClick }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [logoUrl,     setLogoUrl]     = useState<string | null>(null)
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    fetch('/api/dashboard/company')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.name)     setCompanyName(d.legal_name || d.name)
        if (d?.logo_url) setLogoUrl(d.logo_url)
      })
      .catch(() => {})

    createClient().auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? ''
      setUserInitial(email[0]?.toUpperCase() ?? '?')
    })
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    if (typeof window !== 'undefined') localStorage.removeItem('visbot_token')
    router.push('/login')
  }

  return (
    <header
      className="no-print h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
      style={{ background: 'var(--vb-bg-sidebar)', borderBottom: '1px solid var(--vb-border)' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger: tablet only (md → lg) */}
        <button
          onClick={onMenuClick}
          className="hidden md:flex lg:hidden items-center justify-center w-8 h-8 rounded-lg transition-colors -ml-1"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)' }}
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <div className="flex items-center gap-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={companyName} className="rounded-md object-cover flex-shrink-0"
              style={{ width: 22, height: 22 }} />
          )}
          <span className="text-sm font-medium" style={{ color: 'var(--vb-text)' }}>
            {companyName || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Bell */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)' }}
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>

        {/* Logout (icon only) */}
        <button
          onClick={logout}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)' }}
          title="Sign out"
        >
          <LogOut size={15} />
        </button>

        {/* User avatar */}
        <div
          className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold select-none"
          style={{ background: 'var(--vb-bg-active)', color: 'var(--vb-text)' }}
        >
          {userInitial}
        </div>
      </div>
    </header>
  )
}
