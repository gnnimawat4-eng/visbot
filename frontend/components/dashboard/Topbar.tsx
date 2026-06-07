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
      className="h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
      style={{ background: '#FFFFFF', borderBottom: '1px solid #EAEAEA' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger: tablet only (md → lg) */}
        <button
          onClick={onMenuClick}
          className="hidden md:flex lg:hidden items-center justify-center w-8 h-8 rounded-lg transition-colors -ml-1"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#6B7280' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
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
          <span className="text-sm font-medium" style={{ color: '#0A0A0A' }}>
            {companyName || 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Bell */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#6B7280' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>

        {/* Logout (icon only) */}
        <button
          onClick={logout}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#6B7280' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          title="Sign out"
        >
          <LogOut size={15} />
        </button>

        {/* User avatar */}
        <div
          className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold select-none"
          style={{ background: '#18181B', color: '#FFFFFF' }}
        >
          {userInitial}
        </div>
      </div>
    </header>
  )
}
