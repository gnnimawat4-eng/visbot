'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface VerifyResult {
  valid: boolean
  reason?: string
  invitation?: {
    id: string
    visitor_name: string
    visitor_phone: string
    host_name: string
    purpose: string
    scheduled_date: string
    scheduled_time?: string
    invite_code: string
    status: string
  }
}

const REASON_MSG: Record<string, string> = {
  not_found:    'QR code not found or invalid.',
  already_used: 'This invitation has already been used.',
  cancelled:    'This invitation was cancelled.',
  expired:      'This invitation has expired.',
  wrong_date:   'This invitation is not valid today.',
}

export default function ScanPage() {
  const router  = useRouter()
  const scanRef = useRef<HTMLDivElement>(null)
  const [result,    setResult]    = useState<VerifyResult | null>(null)
  const [scanning,  setScanning]  = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!scanning || !scanRef.current) return
    let scanner: import('html5-qrcode').Html5QrcodeScanner | null = null

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
      scanner.render(
        async (decodedText) => {
          scanner?.clear()
          setScanning(false)
          // Extract token from URL or use raw value
          let token = decodedText
          try {
            const url = new URL(decodedText)
            const parts = url.pathname.split('/')
            token = parts[parts.length - 1]
          } catch {}
          const res = await fetch(`/api/invitations/verify?token=${token}`)
          const data: VerifyResult = await res.json()
          setResult(data)
        },
        (err) => console.debug('QR scan:', err)
      )
    })

    return () => { scanner?.clear().catch(() => {}) }
  }, [scanning])

  async function handleCheckIn() {
    if (!result?.invitation) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/invitations/${result.invitation.id}/use`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setCheckedIn(true)
    } else {
      setError(data.error ?? 'Check-in failed')
    }
    setLoading(false)
  }

  function reset() {
    setResult(null)
    setCheckedIn(false)
    setError('')
    setScanning(true)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--vb-bg-page)' }}>
      <div style={{ background: 'var(--vb-bg-sidebar)', borderBottom: '1px solid var(--vb-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()} style={{ color: 'var(--vb-text-secondary)', fontSize: 20 }}>←</button>
          <div className="flex-1">
            <p style={{ color: 'var(--vb-text-primary)', fontWeight: 700, fontSize: 16 }}>Scan QR Pass</p>
            <p style={{ color: 'var(--vb-text-secondary)', fontSize: 12 }}>Point camera at visitor's QR code</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Scanner */}
        {scanning && (
          <div className="mt-4">
            <div id="qr-reader" ref={scanRef} className="rounded-lg overflow-hidden" />
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-3">
              Hold the QR code steady in front of the camera
            </p>
            <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs text-gray-400 text-center mb-2">Or check expected visitors manually</p>
              <button onClick={() => router.push('/guard/expected')}
                className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                📋 View Expected List
              </button>
            </div>
          </div>
        )}

        {/* Success check-in */}
        {checkedIn && result?.invitation && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-bold text-green-600">Checked In!</h2>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 text-left space-y-2">
              <p className="font-bold text-gray-900 dark:text-white text-lg">{result.invitation.visitor_name}</p>
              <p className="text-sm text-gray-500">{result.invitation.visitor_phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Host: <span className="font-semibold">{result.invitation.host_name}</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">Purpose: {result.invitation.purpose}</p>
            </div>
            <button onClick={() => router.push('/guard')}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors">
              Back to Hub
            </button>
          </div>
        )}

        {/* Invalid QR */}
        {result && !result.valid && !checkedIn && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-6xl">🚫</div>
            <h2 className="text-xl font-bold text-red-600">Invalid Pass</h2>
            <p className="text-sm text-gray-500">{REASON_MSG[result.reason ?? ''] ?? 'This QR code is not valid.'}</p>
            <button onClick={reset}
              className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Scan Again
            </button>
          </div>
        )}

        {/* Valid QR → confirm check-in */}
        {result?.valid && result.invitation && !checkedIn && (
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-2">🎫</div>
              <h2 className="text-lg font-bold text-green-600">Valid Invitation</h2>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 space-y-2">
              <p className="font-bold text-gray-900 dark:text-white text-xl">{result.invitation.visitor_name}</p>
              <p className="text-sm text-gray-500">{result.invitation.visitor_phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Host: <span className="font-semibold">{result.invitation.host_name}</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">Purpose: {result.invitation.purpose}</p>
              <p className="text-xs font-mono text-gray-400 mt-1">{result.invitation.invite_code}</p>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Scan Again
              </button>
              <button onClick={handleCheckIn} disabled={loading}
                className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
                {loading ? 'Checking in…' : 'Check In ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
