'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props { visitorData: Record<string, unknown> }

export function OtpVerify({ visitorData }: Props) {
  const [otp, setOtp]           = useState('')
  const [verifying, setVerifying] = useState(false)
  const [done, setDone]         = useState(false)

  const verify = async () => {
    setVerifying(true)
    const res = await fetch('/api/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: visitorData.phone, otp }),
    })
    const json = await res.json()
    setVerifying(false)
    if (json.verified) {
      // Submit final check-in
      await fetch('/api/checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...visitorData, company_id: process.env.NEXT_PUBLIC_COMPANY_ID }),
      })
      setDone(true)
    } else {
      toast.error(json.error || 'Wrong OTP')
    }
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-4xl mb-3">✅</div>
      <h2 className="text-lg font-semibold text-gray-900">Welcome!</h2>
      <p className="text-sm text-gray-500 mt-1">Your host has been notified.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">
        {visitorData.returning ? '👋 Welcome back! OTP sent to your number.' : 'OTP sent to your mobile number.'}
      </p>
      <input
        value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="block w-full text-center text-2xl font-mono border border-gray-200 rounded-xl py-3 tracking-[0.5em]"
        placeholder="_ _ _ _ _ _" maxLength={6}
      />
      <button onClick={verify} disabled={otp.length < 6 || verifying}
        className="w-full bg-brand-500 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
        {verifying ? 'Verifying...' : 'Verify & Check In'}
      </button>
    </div>
  )
}
