'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, LogOut, CheckCircle, Loader2, RotateCcw } from 'lucide-react'
import { OtpBoxes } from '@/components/ui/OtpBoxes'
import { formatTime } from '@/lib/utils'
import { useConfig } from '@/lib/config'
import toast from 'react-hot-toast'

interface CheckIn {
  id: string
  purpose: string
  host_name: string
  host_phone: string | null
  created_at: string
  visitor: { name: string; phone: string } | null
}

interface CardOtp {
  sent: boolean
  code: string      // demo: actual OTP
  value: string     // digits entered by visitor
  sending: boolean
  confirming: boolean
  countdown: number
}

export default function GuardExitPage() {
  const config  = useConfig()
  const otpLen  = config.otp_length || 6

  const [query,   setQuery]   = useState('')
  const [rows,    setRows]    = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [done,    setDone]    = useState<string | null>(null)

  // Per-card OTP state
  const [cardOtps, setCardOtps] = useState<Record<string, CardOtp>>({})
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  const load = useCallback((q = query) => {
    setLoading(true)
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    fetch(`/api/guard/exit?${p}`)
      .then(r => r.json())
      .then(d => { setRows(d.checkins ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [query])

  useEffect(() => { load('') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear all countdown timers on unmount
  useEffect(() => {
    return () => { Object.values(timers.current).forEach(clearInterval) }
  }, [])

  // ── Complete exit without OTP (when otp_required_on_exit is false) ────────
  const directExit = useCallback(async (row: CheckIn) => {
    setCardOtps(prev => ({
      ...prev,
      [row.id]: { sent: false, code: '', value: '', sending: true, confirming: false, countdown: 0 },
    }))
    try {
      const res  = await fetch(`/api/guard/exit/${row.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(row.id)
        toast.success(`${row.visitor?.name ?? 'Visitor'} checked out`)
        if (data.sms?.success) {
          toast.success(`Exit notification sent to host ${data.sms.hostName}`, { icon: '💬' })
        }
        setTimeout(() => {
          setRows(prev => prev.filter(r => r.id !== row.id))
          setDone(null)
          setCardOtps(prev => { const n = { ...prev }; delete n[row.id]; return n })
        }, 1500)
      } else {
        toast.error(data.error ?? 'Failed to check out')
        setCardOtps(prev => { const n = { ...prev }; delete n[row.id]; return n })
      }
    } catch {
      toast.error('Network error')
      setCardOtps(prev => { const n = { ...prev }; delete n[row.id]; return n })
    }
  }, [])

  // ── Start countdown for a card ────────────────────────────────────
  const startCountdown = (id: string) => {
    if (timers.current[id]) clearInterval(timers.current[id])
    setCardOtps(prev => ({ ...prev, [id]: { ...prev[id], countdown: 30 } }))
    timers.current[id] = setInterval(() => {
      setCardOtps(prev => {
        const cur = prev[id]
        if (!cur || cur.countdown <= 1) {
          clearInterval(timers.current[id])
          return { ...prev, [id]: { ...cur, countdown: 0 } }
        }
        return { ...prev, [id]: { ...cur, countdown: cur.countdown - 1 } }
      })
    }, 1000)
  }

  // ── Send OTP and expand card ──────────────────────────────────────
  const openCard = async (row: CheckIn) => {
    // Skip OTP flow if not required by config
    if (!config.otp_required_on_exit) {
      await directExit(row)
      return
    }

    const phone = row.visitor?.phone
    if (!phone) { toast.error('No visitor phone on record'); return }

    setCardOtps(prev => ({
      ...prev,
      [row.id]: { sent: false, code: '', value: '', sending: true, confirming: false, countdown: 0 },
    }))

    try {
      const res  = await fetch('/api/guard/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (data.otpSent) {
        setCardOtps(prev => ({
          ...prev,
          [row.id]: { sent: true, code: data.otp ?? '', value: '', sending: false, confirming: false, countdown: 30 },
        }))
        startCountdown(row.id)
      } else {
        toast.error('Could not send OTP')
        setCardOtps(prev => { const n = { ...prev }; delete n[row.id]; return n })
      }
    } catch {
      toast.error('Network error')
      setCardOtps(prev => { const n = { ...prev }; delete n[row.id]; return n })
    }
  }

  // ── Resend OTP for a card ─────────────────────────────────────────
  const resendOtp = async (row: CheckIn) => {
    const phone = row.visitor?.phone
    if (!phone) return
    setCardOtps(prev => ({ ...prev, [row.id]: { ...prev[row.id], sending: true } }))
    try {
      const res  = await fetch('/api/guard/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.otpSent) {
        setCardOtps(prev => ({
          ...prev,
          [row.id]: { ...prev[row.id], code: data.otp ?? '', value: '', sending: false },
        }))
        startCountdown(row.id)
      } else {
        setCardOtps(prev => ({ ...prev, [row.id]: { ...prev[row.id], sending: false } }))
        toast.error('Could not resend OTP')
      }
    } catch {
      setCardOtps(prev => ({ ...prev, [row.id]: { ...prev[row.id], sending: false } }))
    }
  }

  // ── Confirm exit with OTP ─────────────────────────────────────────
  const confirmExit = async (row: CheckIn) => {
    const state = cardOtps[row.id]
    if (!state || state.value.length < otpLen) return

    setCardOtps(prev => ({ ...prev, [row.id]: { ...prev[row.id], confirming: true } }))

    const res  = await fetch(`/api/guard/exit/${row.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: state.value }),
    })
    const data = await res.json()

    if (res.ok) {
      clearInterval(timers.current[row.id])
      setDone(row.id)
      toast.success(`${row.visitor?.name ?? 'Visitor'} checked out`)
      if (data.sms?.success) {
        toast.success(`Exit notification sent to host ${data.sms.hostName}`, { icon: '💬' })
      }
      setTimeout(() => {
        setRows(prev => prev.filter(r => r.id !== row.id))
        setDone(null)
        setCardOtps(prev => { const n = { ...prev }; delete n[row.id]; return n })
      }, 1500)
    } else {
      toast.error(data.error ?? 'Invalid OTP')
      setCardOtps(prev => ({ ...prev, [row.id]: { ...prev[row.id], confirming: false, value: '' } }))
    }
  }

  // ── Cancel card expansion ─────────────────────────────────────────
  const cancelCard = (id: string) => {
    clearInterval(timers.current[id])
    setCardOtps(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Visitor Exit</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {loading ? 'Loading…' : `${rows.length} visitor${rows.length === 1 ? '' : 's'} currently inside`}
          {!loading && <span className="text-gray-400 dark:text-gray-600"> · tap Exit to check out</span>}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); load(e.target.value) }}
          placeholder="Search by name or phone…"
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 rounded-lg" style={{ border: '1px solid var(--vb-border)', background: 'var(--vb-bg-card)' }}>
          <p className="text-sm" style={{ color: 'var(--vb-text-3)' }}>No active check-ins found</p>
          <button onClick={() => { setQuery(''); load('') }}
            className="mt-3 text-xs hover:underline" style={{ color: 'var(--vb-accent)' }}>Show all →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => {
            const otpState = cardOtps[row.id]
            const isDone   = done === row.id

            return (
              <div
                key={row.id}
                className={`bg-white dark:bg-gray-900 rounded-xl border transition-all ${
                  isDone
                    ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20'
                    : otpState
                      ? 'border-brand-200 dark:border-brand-700 shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                {/* ── Card header ── */}
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold flex-shrink-0 text-sm">
                    {(row.visitor?.name ?? '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{row.visitor?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{row.visitor?.phone} · {row.purpose}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Host: {row.host_name} · In at {formatTime(row.created_at)}</p>
                  </div>

                  {isDone ? (
                    <CheckCircle size={22} className="text-brand-500 flex-shrink-0" />
                  ) : otpState && config.otp_required_on_exit ? (
                    <button
                      onClick={() => cancelCard(row.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      Cancel
                    </button>
                  ) : !otpState ? (
                    <button
                      onClick={() => openCard(row)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
                    >
                      <LogOut size={13} /> Exit
                    </button>
                  ) : null}
                </div>

                {/* ── OTP expansion (only when OTP required) ── */}
                {otpState && config.otp_required_on_exit && !isDone && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                    {otpState.sending ? (
                      <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
                        <Loader2 size={15} className="animate-spin" /> Sending OTP…
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Enter visitor OTP
                          </p>
                          {otpState.code && (
                            <span className="text-xs bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                              Demo: {otpState.code}
                            </span>
                          )}
                        </div>

                        <OtpBoxes
                          value={otpState.value}
                          onChange={val => setCardOtps(prev => ({
                            ...prev,
                            [row.id]: { ...prev[row.id], value: val },
                          }))}
                          disabled={otpState.confirming}
                          length={otpLen}
                        />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            {otpState.countdown > 0 ? (
                              <p className="text-xs text-gray-400 dark:text-gray-500">Resend in {otpState.countdown}s</p>
                            ) : (
                              <button
                                onClick={() => resendOtp(row)}
                                className="text-xs text-brand-500 hover:underline flex items-center gap-1"
                              >
                                <RotateCcw size={11} /> Resend OTP
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => confirmExit(row)}
                            disabled={otpState.confirming || otpState.value.length < otpLen}
                            className="px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                          >
                            {otpState.confirming
                              ? <><Loader2 size={12} className="animate-spin" /> Verifying…</>
                              : <><LogOut size={12} /> Confirm Exit</>
                            }
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
