'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MoreHorizontal, X } from 'lucide-react'

export interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  exact?: boolean   // true → only active on exact match
  badge?: number
}

interface BottomNavProps {
  /** Up to 4 items shown in the bar itself */
  primary: NavItem[]
  /** Overflow items shown in the "More" slide-up sheet */
  secondary?: NavItem[]
}

function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

export function BottomNav({ primary, secondary = [] }: BottomNavProps) {
  const pathname  = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const hasMore = secondary.length > 0

  return (
    <>
      {/* More-sheet backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More slide-up sheet */}
      {hasMore && (
        <div
          aria-hidden={!moreOpen}
          className={[
            'fixed inset-x-0 bottom-0 z-50 md:hidden rounded-t-2xl',
            'transition-transform duration-300 ease-out',
            moreOpen ? 'translate-y-0' : 'translate-y-full',
          ].join(' ')}
          style={{
            background: 'var(--vb-bg-sidebar)',
            borderTop: '1px solid var(--vb-border)',
          }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--vb-text)' }}>More</p>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--vb-text-3)' }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 px-5 pb-6">
            {secondary.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-colors active:scale-[0.96]"
                style={{ background: 'var(--vb-bg-hover)', color: 'var(--vb-text-2)' }}
              >
                <Icon size={22} />
                <span className="text-xs text-center leading-tight font-medium">{label}</span>
              </Link>
            ))}
          </div>
          {/* iOS home-indicator spacing */}
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      )}

      {/* Bottom nav bar — hidden on md+ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex md:hidden"
        style={{
          background: 'var(--vb-bg-sidebar)',
          borderTop: '1px solid var(--vb-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {primary.map((item) => {
          const active = isActive(item, pathname)
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors"
              style={{ color: active ? 'var(--vb-accent)' : 'var(--vb-text-3)', minHeight: '56px' }}
            >
              {/* Active top-line indicator */}
              {active && (
                <span
                  className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: 'var(--vb-accent)' }}
                />
              )}
              <div className="relative">
                <Icon size={22} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}

        {hasMore && (
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={{ color: 'var(--vb-text-3)', minHeight: '56px' }}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        )}
      </nav>
    </>
  )
}
