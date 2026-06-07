'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Props { onMenuClick?: () => void }

export function Topbar({ onMenuClick }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState<string>('')

  useEffect(() => {
    fetch('/api/dashboard/company')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setCompanyName(d.name) })
      .catch(() => {})
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    if (typeof window !== 'undefined') localStorage.removeItem('visbot_token')
    router.push('/login')
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
      style={{ background: 'var(--vb-bg-sidebar)', borderBottom: '1px solid var(--vb-border)' }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger: tablet only (md → lg) */}
        <button
          onClick={onMenuClick}
          className="hidden md:flex lg:hidden items-center justify-center w-8 h-8 rounded-md transition-colors -ml-1"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>
        <p className="text-sm font-medium" style={{ color: 'var(--vb-text)' }}>
          {companyName || 'Dashboard'}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ color: 'var(--vb-text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
