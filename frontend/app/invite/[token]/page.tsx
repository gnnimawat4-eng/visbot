'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import Image from 'next/image'

interface Invitation {
  id: string
  visitor_name: string
  visitor_phone: string
  host_name: string
  purpose: string
  scheduled_date: string
  scheduled_time?: string
  invite_code: string
  qr_token: string
  status: string
  notes?: string
  valid_hours?: number
}

export default function InvitePage() {
  const { token } = useParams()
  const [inv,    setInv]    = useState<Invitation | null>(null)
  const [valid,  setValid]  = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [qrUrl,  setQrUrl]  = useState('')

  useEffect(() => {
    fetch(`/api/invitations/verify?token=${token}`)
      .then(r => r.json())
      .then(d => {
        setValid(d.valid)
        setReason(d.reason ?? '')
        if (d.valid && d.invitation) {
          setInv(d.invitation)
          const url = `${window.location.href}`
          QRCode.toDataURL(url, { width: 280, margin: 2 }).then(setQrUrl)
        }
      })
  }, [token])

  function addToCalendar() {
    if (!inv) return
    const dt = inv.scheduled_date + (inv.scheduled_time ? `T${inv.scheduled_time}:00` : 'T09:00:00')
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${dt.replace(/[-:]/g, '').slice(0, 15)}`,
      `SUMMARY:Visit to ${inv.host_name}`,
      `DESCRIPTION:Invite code: ${inv.invite_code}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `invite-${inv.invite_code}.ics`
    a.click()
  }

  const REASON_MSG: Record<string, string> = {
    not_found:    'This invitation link is invalid or does not exist.',
    already_used: 'This invitation has already been used.',
    cancelled:    'This invitation has been cancelled.',
    expired:      'This invitation has expired.',
    wrong_date:   'This invitation is not valid today.',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-lg mb-3">
            <span className="text-white text-2xl">🏢</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Visitor Pass</h1>
          <p className="text-sm text-gray-500">VisBot — Visitor Management</p>
        </div>

        {valid === null && (
          <div className="bg-white rounded-lg p-8 text-center animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
        )}

        {valid === false && (
          <div className="bg-white rounded-lg p-6 text-center border border-red-100">
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="font-bold text-red-600 text-lg mb-1">Invalid Invitation</h2>
            <p className="text-sm text-gray-500">{REASON_MSG[reason] ?? 'This invitation is not valid.'}</p>
          </div>
        )}

        {valid === true && inv && (
          <div className="space-y-4">
            {/* QR */}
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-sm">
              {qrUrl ? (
                <Image src={qrUrl} alt="Your QR Pass" width={220} height={220} className="rounded-xl" unoptimized />
              ) : (
                <div className="w-56 h-56 bg-gray-100 rounded-xl animate-pulse" />
              )}
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Show this QR to the guard</p>
                <p className="font-mono text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">{inv.invite_code}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg p-5 space-y-3 shadow-sm">
              <h2 className="font-bold text-gray-900 text-base">Your Visit Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-semibold text-gray-900">{inv.visitor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Host</span>
                  <span className="font-semibold text-gray-900">{inv.host_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purpose</span>
                  <span className="font-semibold text-gray-900 capitalize">{inv.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(inv.scheduled_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {inv.scheduled_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="font-semibold text-gray-900">{inv.scheduled_time}</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={addToCalendar}
              className="w-full py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              📅 Add to Calendar
            </button>

            <p className="text-xs text-center text-gray-400 pb-4">
              Powered by VisBot · Present this QR at the security gate
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
