'use client'
import { useEffect, useState } from 'react'
import { useConfig } from '@/lib/config'
import toast from 'react-hot-toast'

interface Props { visitorData: Record<string, unknown> }

export function OtpVerify({ visitorData }: Props) {
  const config    = useConfig()
  const otpLength = config.otp_length || 6

  const [otp,       setOtp]       = useState('')
  const [verifying, setVerifying] = useState(false)
  const [done,      setDone]      = useState(false)

  const doCheckin = async () => {
    await fetch('/api/checkin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...visitorData, company_id: process.env.NEXT_PUBLIC_COMPANY_ID }),
    })
    setDone(true)
  }

  // Auto-complete checkin when OTP is not required
  useEffect(() => {
    if (visitorData.skipOtp) {
      void doCheckin()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verify = async () => {
    if (otp.length < otpLength) return
    setVerifying(true)
    const res  = await fetch('/api/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: visitorData.phone, otp }),
    })
    const json = await res.json()
    if (json.verified) {
      await doCheckin()
    } else {
      setVerifying(false)
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

  // Show spinner while auto-submitting (skipOtp path)
  if (visitorData.skipOtp) return (
    <div className="text-center py-8">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500">Completing check-in…</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">
        {visitorData.returning ? '👋 Welcome back! OTP sent to your number.' : 'OTP sent to your mobile number.'}
      </p>
      <input
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, otpLength))}
        className="block w-full text-center text-2xl font-mono border border-gray-200 rounded-xl py-3 tracking-[0.5em]"
        placeholder={'_ _ _ _ _ _'.slice(0, otpLength * 2 - 1)}
        maxLength={otpLength}
      />
      <button onClick={verify} disabled={otp.length < otpLength || verifying}
        className="w-full bg-brand-500 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
        {verifying ? 'Verifying…' : 'Verify & Check In'}
      </button>
    </div>
  )
}
