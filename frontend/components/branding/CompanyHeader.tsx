import Image from 'next/image'
import type { CompanyBranding } from '@/lib/pdfBranding'

interface Props {
  branding: CompanyBranding | null
  variant: 'sidebar' | 'topbar' | 'kiosk' | 'invite'
}

/**
 * Renders company logo + name for different UI contexts.
 * Falls back to VisBot branding if no company branding is set.
 */
export function CompanyHeader({ branding, variant }: Props) {
  const name = branding?.legal_name || branding?.name || 'VisBot'
  const logo = branding?.logo_url

  if (variant === 'sidebar') {
    if (logo) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} width={28} height={28}
          className="rounded-lg object-cover flex-shrink-0"
          style={{ width: 28, height: 28 }}
        />
      )
    }
    return (
      <span className="font-semibold text-[15px] tracking-tight" style={{ color: '#0A0A0A' }}>
        Vis<span style={{ color: '#10B981' }}>Bot</span>
      </span>
    )
  }

  if (variant === 'topbar') {
    return (
      <div className="flex items-center gap-2">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="rounded-md object-cover flex-shrink-0"
            style={{ width: 22, height: 22 }}
          />
        )}
        <span className="text-sm font-medium" style={{ color: '#0A0A0A' }}>{name}</span>
      </div>
    )
  }

  if (variant === 'kiosk') {
    if (logo) {
      return (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={name} className="rounded-2xl object-contain"
            style={{ width: 72, height: 72 }}
          />
          <h1 className="text-2xl font-bold text-white">{name}</h1>
        </div>
      )
    }
    return (
      <h1 className="text-3xl font-bold text-white">
        Vis<span className="text-brand-400">Bot</span>
      </h1>
    )
  }

  // invite variant
  if (logo) {
    return (
      <div className="flex flex-col items-center gap-2 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="rounded-xl object-contain"
          style={{ width: 56, height: 56 }}
        />
        <p className="text-sm text-gray-500">{name}</p>
      </div>
    )
  }
  return (
    <>
      <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-lg mb-3">
        <span className="text-white text-2xl">🏢</span>
      </div>
      <p className="text-sm text-gray-500">{name}</p>
    </>
  )
}
