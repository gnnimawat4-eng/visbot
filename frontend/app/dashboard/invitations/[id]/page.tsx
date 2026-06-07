'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import Image from 'next/image'

interface Invitation {
  id: string
  visitor_name: string
  visitor_phone: string
  visitor_email?: string
  host_name: string
  purpose: string
  scheduled_date: string
  scheduled_time?: string
  invite_code: string
  qr_token: string
  status: string
  notes?: string
  valid_hours?: number
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  used:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  expired:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 text-right">{value}</span>
    </div>
  )
}

export default function InvitationDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const [inv,     setInv]     = useState<Invitation | null>(null)
  const [qrUrl,   setQrUrl]   = useState('')
  const [loading, setLoading] = useState(true)
  const [resent,  setResent]  = useState(false)

  useEffect(() => {
    fetch(`/api/invitations/${id}`).then(r => r.json()).then(d => {
      setInv(d.invitation)
      setLoading(false)
      if (d.invitation?.qr_token) {
        const inviteUrl = `${window.location.origin}/invite/${d.invitation.qr_token}`
        QRCode.toDataURL(inviteUrl, { width: 300, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } })
          .then(setQrUrl)
      }
    })
  }, [id])

  async function handleCancel() {
    if (!confirm('Cancel this invitation?')) return
    await fetch(`/api/invitations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
    router.push('/dashboard/invitations')
  }

  async function handleResend() {
    await fetch(`/api/invitations/${id}/resend`, { method: 'POST' })
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  function handleDownload() {
    if (!qrUrl || !inv) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `invite-${inv.invite_code}.png`
    a.click()
  }

  if (loading) return <div className="p-6 animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" /><div className="h-80 bg-gray-100 dark:bg-gray-900 rounded-lg" /></div>
  if (!inv) return <div className="p-6 text-gray-500">Invitation not found</div>

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inv.qr_token}`

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{inv.visitor_name}</h1>
          <p className="text-xs font-mono text-gray-400">{inv.invite_code}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[inv.status] ?? ''}`}>
          {inv.status}
        </span>
      </div>

      {/* QR Code */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
        {qrUrl ? (
          <Image src={qrUrl} alt="QR Code" width={240} height={240} className="rounded-xl" unoptimized />
        ) : (
          <div className="w-60 h-60 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        )}
        <p className="text-xs text-gray-400 font-mono text-center break-all">{inviteUrl}</p>
        <div className="flex gap-2 w-full">
          <button onClick={handleDownload}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Download QR
          </button>
          {inv.status === 'pending' && (
            <button onClick={handleResend}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                resent ? 'bg-green-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}>
              {resent ? 'Link Copied!' : 'Share Link'}
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
        <Row label="Phone"    value={inv.visitor_phone} />
        <Row label="Email"    value={inv.visitor_email} />
        <Row label="Host"     value={inv.host_name} />
        <Row label="Purpose"  value={inv.purpose} />
        <Row label="Date"     value={new Date(inv.scheduled_date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} />
        <Row label="Time"     value={inv.scheduled_time} />
        <Row label="Valid For" value={inv.valid_hours ? `${inv.valid_hours} hours` : undefined} />
        <Row label="Notes"    value={inv.notes} />
        <Row label="Created"  value={new Date(inv.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} />
      </div>

      {inv.status === 'pending' && (
        <button onClick={handleCancel}
          className="w-full py-3 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Cancel Invitation
        </button>
      )}
    </div>
  )
}
