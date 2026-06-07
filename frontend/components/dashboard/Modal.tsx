'use client'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, description, children, size = 'md' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop — simple, no blur */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div
        className={`relative z-10 w-full ${SIZES[size]} rounded-lg shadow-lg`}
        style={{
          background: 'var(--vb-bg-card)',
          border: '1px solid var(--vb-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--vb-border)' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--vb-text)' }}>{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--vb-text-3)' }}>{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors ml-4 flex-shrink-0"
            style={{ color: 'var(--vb-text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--vb-bg-hover)'; e.currentTarget.style.color = 'var(--vb-text-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vb-text-3)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
