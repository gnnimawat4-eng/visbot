'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, Clock, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { useConfig, DEFAULT_CONFIG } from '@/lib/config'
import { PhotoCaptureWidget } from '@/components/ui/PhotoCaptureWidget'
import { OtpBoxes } from '@/components/ui/OtpBoxes'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface BlacklistEntry {
  id: string
  name: string
  reason: string
  severity: string
  phone?: string
}

const PURPOSES = ['meeting', 'delivery', 'interview', 'official', 'other'] as const
const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500'
const LABEL = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5'

interface Host { id: string; full_name: string; phone: string }

// 30-second resend countdown
function useCountdown(seconds = 30) {
  const [count, setCount] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (ref.current) clearInterval(ref.current)
    setCount(seconds)
    ref.current = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(ref.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }, [seconds])

  useEffect(() => () => { if (ref.current) clearInterval(ref.current) }, [])
  return { count, start, canResend: count === 0 }
}

export default function GuardEntryPage() {
  const router = useRouter()
  const config = useConfig()

  // Form fields
  const [phone,     setPhone]     = useState('')
  const [name,      setName]      = useState('')
  const [purpose,   setPurpose]   = useState<typeof PURPOSES[number]>('meeting')
  const [hostName,  setHostName]  = useState('')
  const [hostPhone, setHostPhone] = useState('')
  const [photoUrl,  setPhotoUrl]  = useState('')
  const [company,   setCompany]   = useState('')

  // Visitor lookup
  const [returning,  setReturning]  = useState(false)
  const [lastVisit,  setLastVisit]  = useState<string | null>(null)
  const [looking,    setLooking]    = useState(false)

  // OTP state
  const [otp,       setOtp]      = useState('')
  const [otpSent,   setOtpSent]  = useState(false)
  const [otpCode,   setOtpCode]  = useState('') // demo: actual OTP shown on screen
  const [sending,   setSending]  = useState(false)

  // Blacklist check
  const [blacklisted,    setBlacklisted]    = useState(false)
  const [blacklistEntry, setBlacklistEntry] = useState<BlacklistEntry | null>(null)
  const [overriding,     setOverriding]     = useState(false)

  // Submit / success
  const [submitting, setSubmitting] = useState(false)
  const [checkedIn,  setCheckedIn]  = useState<{ name: string; host: string } | null>(null)

  // VIP approval flow
  const [isVip,           setIsVip]           = useState(false)
  const [vipReason,       setVipReason]       = useState('')
  const [approvalId,      setApprovalId]      = useState('')
  const [approvalState,   setApprovalState]   = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle')
  const [rejectionReason, setRejectionReason] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Host autocomplete
  const [hosts,         setHosts]         = useState<Host[]>([])
  const [hostDropOpen,  setHostDropOpen]  = useState(false)
  const [hostSearching, setHostSearching] = useState(false)
  const hostDropRef  = useRef<HTMLDivElement>(null)
  const hostDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lookupTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { count: resendCount, start: startCountdown, canResend } = useCountdown(30)

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.company?.name) setCompany(d.company.name) }).catch(() => {})
  }, [])

  // Close host dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (hostDropRef.current && !hostDropRef.current.contains(e.target as Node))
        setHostDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Send OTP ───────────────────────────────────────────────────────
  const sendOtpTo = useCallback(async (phoneNum: string) => {
    setSending(true)
    try {
      const res  = await fetch('/api/guard/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNum }),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { /* non-JSON body */ }

      if (!res.ok) {
        toast.error((data.error as string) ?? `OTP send failed (${res.status})`)
        return
      }
      if (data.otpSent) {
        setOtpSent(true)
        setOtp('')
        setOtpCode((data.otp as string) ?? '')
        startCountdown()
      } else {
        toast.error('Could not send OTP')
      }
    } catch (err) {
      console.error('OTP send error:', err)
      toast.error('Could not send OTP — check your connection')
    } finally {
      setSending(false)
    }
  }, [startCountdown])

  // ── VIP approval flow ─────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const startApprovalPolling = useCallback((id: string, onApproved: () => void) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/approvals/${id}/status`)
        const data = await res.json()
        const status = data.approval?.status
        if (status === 'approved') {
          stopPolling()
          setApprovalState('approved')
          setTimeout(() => onApproved(), 600)
        } else if (status === 'rejected') {
          stopPolling()
          setRejectionReason(data.approval?.rejection_reason ?? '')
          setApprovalState('rejected')
        }
      } catch {}
    }, 5000)
  }, [stopPolling])

  const handleSendOtpButton = useCallback(async () => {
    if (!phone) return
    if (!isVip) { sendOtpTo(phone); return }

    if (!name || !hostName) { toast.error('Fill in name and host before requesting VIP approval'); return }

    setSending(true)
    try {
      const res  = await fetch('/api/approvals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'vip_entry',
          visitor_name: name,
          visitor_phone: phone,
          visitor_photo_url: photoUrl || null,
          visitor_purpose: purpose,
          visitor_company: company || null,
          visitor_vip_reason: vipReason || null,
          notes: vipReason || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to create approval request'); return }
      const id = data.approval?.id
      setApprovalId(id)
      setApprovalState('pending')
      toast('Approval request sent to admin', { icon: '⏳' })
      startApprovalPolling(id, () => sendOtpTo(phone))
    } finally {
      setSending(false)
    }
  }, [phone, isVip, name, hostName, photoUrl, purpose, company, vipReason, sendOtpTo, startApprovalPolling])

  // clean up polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  // ── Phone change → blacklist check → lookup → conditional auto-send OTP ──
  const handlePhone = useCallback((val: string) => {
    setPhone(val)
    setOtpSent(false); setOtp(''); setOtpCode('')
    setBlacklisted(false); setBlacklistEntry(null); setOverriding(false)
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    if (val.replace(/\D/g, '').length < 10) { setReturning(false); setLastVisit(null); return }
    lookupTimer.current = setTimeout(async () => {
      setLooking(true)
      try {
        // Blacklist check first
        const blRes  = await fetch(`/api/blacklist/check?phone=${encodeURIComponent(val)}`)
        const blData = await blRes.json()
        if (blData.blacklisted) {
          setBlacklisted(true)
          setBlacklistEntry(blData.entry)
          // Auto-log the attempt
          fetch(`/api/blacklist/${blData.entry.id}/attempt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: val }),
          })
          return
        }

        const res  = await fetch(`/api/guard/lookup?phone=${encodeURIComponent(val)}`)
        const data = await res.json()
        if (data.found) {
          setName(data.visitor.name)
          if (data.lastCheckin) {
            setPurpose(data.lastCheckin.purpose ?? 'meeting')
            setHostName(data.lastCheckin.host_name ?? '')
            setHostPhone(data.lastCheckin.host_phone ?? '')
            setLastVisit(data.lastCheckin.created_at)
          }
          setReturning(true)
          // Auto-send OTP only if OTP is required AND not skipped for returning visitors
          if (config.otp_required_on_entry && !config.otp_skip_for_returning) {
            await sendOtpTo(val)
          }
        } else {
          setReturning(false); setLastVisit(null)
        }
      } finally { setLooking(false) }
    }, 600)
  }, [sendOtpTo, config.otp_required_on_entry, config.otp_skip_for_returning])

  // ── Host autocomplete ─────────────────────────────────────────────
  const searchHosts = useCallback((q: string) => {
    setHostName(q); setHostPhone('')
    if (hostDebounce.current) clearTimeout(hostDebounce.current)
    if (!q.trim()) { setHosts([]); setHostDropOpen(false); return }
    hostDebounce.current = setTimeout(async () => {
      setHostSearching(true)
      const res  = await fetch(`/api/guard/hosts?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setHosts(data.hosts ?? [])
      setHostDropOpen((data.hosts ?? []).length > 0)
      setHostSearching(false)
    }, 300)
  }, [])

  const selectHost = (h: Host) => {
    setHostName(h.full_name); setHostPhone(h.phone ?? ''); setHostDropOpen(false)
  }

  // ── Final check-in ────────────────────────────────────────────────
  const handleCheckIn = async (skipOtp = false) => {
    const otpLen = config.otp_length || 6
    if (!name || !phone || !hostName) { toast.error(`Name, phone and ${config.label_host.toLowerCase()} are required`); return }
    if (!skipOtp) {
      if (!otpSent)              { toast.error('Send OTP first'); return }
      if (otp.length < otpLen)   { toast.error(`Enter the ${otpLen}-digit OTP`); return }
    }

    setSubmitting(true)
    try {
      const res  = await fetch('/api/guard/entry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, purpose, host_name: hostName, host_phone: hostPhone, photo_url: photoUrl || null, company, otp: skipOtp ? 'SKIP' : otp, skip_otp: skipOtp }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Check-in failed'); return }

      if (data.sms?.success) {
        toast.success(`Entry SMS sent to ${data.sms.maskedPhone}`, { icon: '💬' })
      }
      setCheckedIn({ name, host: hostName })
    } finally { setSubmitting(false) }
  }

  const reset = () => {
    stopPolling()
    setPhone(''); setName(''); setPurpose('meeting'); setHostName(''); setHostPhone('')
    setPhotoUrl(''); setOtp(''); setOtpSent(false); setOtpCode('')
    setReturning(false); setLastVisit(null); setCheckedIn(null)
    setBlacklisted(false); setBlacklistEntry(null); setOverriding(false)
    setIsVip(false); setVipReason(''); setApprovalId(''); setApprovalState('idle'); setRejectionReason('')
  }

  // ── Success ──────────────────────────────────────────────────────
  if (checkedIn) {
    return (
      <div className="text-center py-16 space-y-5">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Entry complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{checkedIn.name} has been checked in.</p>
          {hostPhone && (
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Host {checkedIn.host} will be notified on exit.</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors">
            New Entry
          </button>
          <button onClick={() => router.push('/guard')}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Overview
          </button>
        </div>
      </div>
    )
  }

  // ── VIP Approval Waiting Screen ───────────────────────────────────
  if (approvalState === 'pending' && approvalId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Clock size={36} className="text-amber-500 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <Loader2 size={14} className="text-amber-600 animate-spin" />
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Waiting for admin approval</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Checking every 5 seconds…</p>
        </div>
        <div className="w-full max-w-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 text-left space-y-1">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">VIP Entry Request</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{phone}</p>
          {vipReason && <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 italic">"{vipReason}"</p>}
        </div>
        <button
          onClick={() => { stopPolling(); setApprovalState('idle'); setApprovalId('') }}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
        >
          Cancel request
        </button>
      </div>
    )
  }

  if (approvalState === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <XCircle size={36} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Entry Rejected</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Admin has declined this VIP entry request.</p>
        </div>
        {rejectionReason && (
          <div className="w-full max-w-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-left">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Reason</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{rejectionReason}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => { setApprovalState('idle'); setApprovalId(''); setIsVip(false); setVipReason('') }}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
          >
            Continue without VIP
          </button>
          <button onClick={reset}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            New Entry
          </button>
        </div>
      </div>
    )
  }

  if (approvalState === 'approved' && !otpSent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
          <CheckCircle size={36} className="text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">VIP Entry Approved!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sending OTP to visitor now…</p>
        </div>
        <Loader2 size={20} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  // ── Blacklist Alert ───────────────────────────────────────────────
  if (blacklisted && blacklistEntry && !overriding) {
    const SEVERITY_BG: Record<string, string> = {
      low: 'from-blue-600 to-blue-800', medium: 'from-yellow-500 to-orange-600',
      high: 'from-orange-600 to-red-700', critical: 'from-red-600 to-red-900',
    }
    return (
      <div className={`fixed inset-0 z-50 bg-gradient-to-br ${SEVERITY_BG[blacklistEntry.severity] ?? 'from-red-600 to-red-900'} flex flex-col items-center justify-center p-6 text-center`}>
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-black text-white mb-2">ENTRY BLOCKED</h1>
        <div className="bg-white/20 rounded-lg p-5 mb-6 w-full max-w-sm text-left">
          <p className="text-white font-bold text-xl">{blacklistEntry.name}</p>
          <p className="text-white/70 text-sm mt-1">{phone}</p>
          <div className="mt-3 border-t border-white/20 pt-3">
            <p className="text-white/80 text-xs uppercase tracking-wider mb-1">Reason</p>
            <p className="text-white font-semibold">{blacklistEntry.reason}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-white/60">Severity</span>
            <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full capitalize">{blacklistEntry.severity}</span>
          </div>
        </div>
        <p className="text-white/70 text-sm mb-6">This person has been flagged. Entry attempt has been logged.</p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button onClick={reset}
            className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors">
            Clear & New Entry
          </button>
          <button onClick={() => setOverriding(true)}
            className="w-full py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors text-sm">
            Override (Supervisor Auth Required)
          </button>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────
  // Field visibility helpers
  const fv = (key: string) => (config as unknown as Record<string, unknown>)[`field_visitor_${key}`] as string || 'optional'
  const purposes = (config.purposes?.length ? config.purposes : DEFAULT_CONFIG.purposes)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{config.label_visitor} Entry</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enter {config.label_visitor.toLowerCase()} details{config.otp_required_on_entry ? ', then verify with OTP' : ''}.</p>
      </div>

      <div className="space-y-5">

        {/* ── Phone + OTP section ── */}
        <div>
          <label className={LABEL}>Mobile number *</label>
          <div className="relative">
            <input
              value={phone}
              onChange={e => handlePhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={INPUT}
            />
            {looking && (
              <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Returning visitor banner */}
          {returning && lastVisit && (
            <div className="mt-2 px-3 py-2 bg-brand-50 border border-brand-100 rounded-xl text-sm">
              <p className="text-brand-700 font-semibold">Welcome back, {name}!</p>
              <p className="text-brand-600 text-xs mt-0.5">
                Last visit: {format(new Date(lastVisit), 'dd MMM yyyy')} · Fields pre-filled
              </p>
            </div>
          )}

          {/* OTP inline section — slides in below phone */}
          {otpSent && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Enter OTP sent to visitor
                </p>
                {otpCode && (
                  <span className="text-xs bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                    Demo: {otpCode}
                  </span>
                )}
              </div>

              <OtpBoxes value={otp} onChange={setOtp} length={config.otp_length || 6} />

              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => sendOtpTo(phone)}
                    disabled={sending}
                    className="text-xs text-brand-500 hover:underline flex items-center gap-1 mx-auto disabled:opacity-50"
                  >
                    {sending
                      ? <><Loader2 size={11} className="animate-spin" /> Sending…</>
                      : <><RotateCcw size={11} /> Resend OTP</>
                    }
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Resend in {resendCount}s</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Name ── */}
        <div>
          <label className={LABEL}>Full name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ravi Kumar"
            className={INPUT}
          />
        </div>

        {/* ── Purpose ── */}
        {fv('purpose') !== 'hidden' && (
        <div>
          <label className={LABEL}>{config.label_purpose}{fv('purpose') === 'required' ? ' *' : ''}</label>
          <select value={purpose} onChange={e => setPurpose(e.target.value as typeof PURPOSES[number])} className={INPUT + ' bg-white'}>
            {purposes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        )}

        {/* ── Host autocomplete ── */}
        {fv('host') !== 'hidden' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="relative" ref={hostDropRef}>
            <label className={LABEL}>
              {config.label_host}{fv('host') === 'required' ? ' *' : ''}{' '}
              <span className="text-brand-500 text-xs normal-case">(auto)</span>
            </label>
            <div className="relative">
              <input
                value={hostName}
                onChange={e => searchHosts(e.target.value)}
                onFocus={() => hosts.length > 0 && setHostDropOpen(true)}
                placeholder="Search host…"
                className={INPUT}
                autoComplete="off"
              />
              {hostSearching
                ? <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                : <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              }
            </div>
            {hostDropOpen && hosts.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {hosts.map(h => (
                  <li key={h.id}>
                    <button type="button" onClick={() => selectHost(h)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{h.full_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{h.phone}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className={LABEL}>Host phone</label>
            <input
              value={hostPhone}
              onChange={e => setHostPhone(e.target.value)}
              placeholder="+91…"
              className={INPUT}
            />
          </div>
        </div>
        )}

        {/* ── Photo ── */}
        {fv('photo') !== 'hidden' && (
        <PhotoCaptureWidget
          label={`${config.label_visitor} photo${fv('photo') === 'required' ? '' : ' (optional)'}`}
          compact
          onCapture={url => setPhotoUrl(url)}
        />
        )}

        {/* ── VIP Toggle ── */}
        <div className={`p-4 rounded-xl border-2 transition-colors ${isVip ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setIsVip(v => !v)}>
            <div className="relative flex-shrink-0">
              <div className={`w-11 h-6 rounded-full transition-colors ${isVip ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isVip ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">⭐ Mark as VIP Visitor</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Requires admin approval before entry</p>
            </div>
          </label>
          {isVip && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">VIP Reason</label>
              <input value={vipReason} onChange={e => setVipReason(e.target.value)}
                placeholder="e.g. Government Official, Big Client, Investor…"
                className="w-full border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400" />
            </div>
          )}
        </div>

        {/* ── Action button ── */}
        {config.otp_required_on_entry ? (
          // OTP required flow
          !otpSent ? (
            <button type="button" onClick={handleSendOtpButton} disabled={sending || !phone}
              className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending OTP…</> : 'Send OTP →'}
            </button>
          ) : (
            <button type="button" onClick={() => handleCheckIn(false)} disabled={submitting || otp.length < (config.otp_length || 6)}
              className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Checking in…</> : `${config.label_check_in} →`}
            </button>
          )
        ) : (
          // OTP not required — direct check-in
          <button type="button" onClick={() => handleCheckIn(true)} disabled={submitting || !phone || !name || !hostName}
            className="w-full py-3.5 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Checking in…</> : `${config.label_check_in} Directly →`}
          </button>
        )}
      </div>
    </>
  )
}
