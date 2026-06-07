'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Member { name: string; phone: string; id_proof_type: string; id_proof_number: string }

const PURPOSES = ['Interview Panel','Audit','Delivery','Inspection','Meeting','Training','Family Visit','Other']
const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400'
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className={LABEL}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>{children}</div>
}

function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step
  const active = current === step
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done ? 'text-white' : active ? 'text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
        style={done || active ? { background: '#16A34A' } : undefined}>
        {done ? <CheckCircle size={16} /> : step}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

export default function GroupEntryPage() {
  const router = useRouter()
  const [step, setStep]     = useState(1)
  const [hosts, setHosts]   = useState<{ id: string; full_name: string; phone: string | null }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [successCode, setSuccessCode] = useState('')

  // Step 1: Lead
  const [leadName, setLeadName]   = useState('')
  const [leadPhone, setLeadPhone] = useState('')

  // Step 2: Group details
  const [groupSize, setGroupSize] = useState(2)
  const [purpose, setPurpose]     = useState(PURPOSES[0])
  const [hostId, setHostId]       = useState('')
  const [hostName, setHostName]   = useState('')
  const [hostPhone, setHostPhone] = useState('')
  const [notes, setNotes]         = useState('')
  const [exitMode, setExitMode]   = useState<'together' | 'individual'>('together')

  // Step 3: Members
  const [members, setMembers] = useState<Member[]>([{ name: '', phone: '', id_proof_type: '', id_proof_number: '' }])

  useEffect(() => {
    fetch('/api/hosts').then(r => r.json()).then(d => setHosts(d.hosts ?? []))
  }, [])

  useEffect(() => {
    const count = groupSize - 1
    setMembers(prev => {
      if (prev.length < count) return [...prev, ...Array.from({ length: count - prev.length }, () => ({ name: '', phone: '', id_proof_type: '', id_proof_number: '' }))]
      return prev.slice(0, count)
    })
  }, [groupSize])

  function setMember(i: number, k: keyof Member, v: string) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
  }

  function selectHost(id: string) {
    setHostId(id)
    const h = hosts.find(h => h.id === id)
    if (h) { setHostName(h.full_name); setHostPhone(h.phone ?? '') }
  }

  async function submit() {
    if (!leadName || !leadPhone) return toast.error('Lead name and phone required')
    if (members.some(m => !m.name)) return toast.error('All member names required')
    setSubmitting(true)
    try {
      const allMembers = [{ name: leadName, phone: leadPhone, id_proof_type: '', id_proof_number: '' }, ...members]
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_name: leadName, lead_phone: leadPhone, group_size: groupSize,
          purpose, host_id: hostId || null, host_name: hostName || null,
          host_phone: hostPhone || null, members: allMembers,
          notes: notes || null, exit_mode: exitMode,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setSuccessCode(d.group.group_code)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create group')
      setSubmitting(false)
    }
  }

  if (successCode) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--vb-bg)' }}>
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#16A34A' }}>
          <CheckCircle size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Group Checked In!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Group code</p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg py-4 px-6 mb-6">
          <span className="text-3xl font-bold font-mono text-gray-900 dark:text-white">{successCode}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{groupSize} members checked in together</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/guard')} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
            Guard Hub
          </button>
          <button onClick={() => { setStep(1); setSuccessCode(''); setLeadName(''); setLeadPhone(''); setGroupSize(2) }}
            className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ background: '#16A34A' }}>
            New Group
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--vb-bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/guard')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: '#16A34A' }} />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Group Entry</h1>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-between px-2">
          {[{n:1,l:'Lead'},{n:2,l:'Group'},{n:3,l:'Members'},{n:4,l:'Confirm'}].map((s, i, arr) => (
            <div key={s.n} className="flex items-center">
              <StepDot step={s.n} current={step} label={s.l} />
              {i < arr.length - 1 && <div className={`h-0.5 w-8 sm:w-16 mx-1 transition-colors ${step > s.n ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} style={step > s.n ? { background: '#16A34A' } : undefined} />}
            </div>
          ))}
        </div>

        {/* Step 1: Lead Person */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#16A34A' }}>1</div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Lead Person Details</h2>
            </div>
            <Field label="Lead Name" required>
              <input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Full name of group leader" className={INPUT} />
            </Field>
            <Field label="Lead Phone" required>
              <input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="10-digit mobile number" className={INPUT} maxLength={10} inputMode="numeric" />
            </Field>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#e8f8f3', color: '#16A34A' }}>
              ⭐ Lead Person
            </div>
          </div>
        )}

        {/* Step 2: Group Details */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#16A34A' }}>2</div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Group Details</h2>
            </div>
            <Field label="Group Size (including lead)" required>
              <div className="flex items-center gap-3">
                <button onClick={() => setGroupSize(s => Math.max(2, s - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800">−</button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">{groupSize}</span>
                <button onClick={() => setGroupSize(s => Math.min(50, s + 1))}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800">+</button>
              </div>
            </Field>
            <Field label="Purpose" required>
              <select value={purpose} onChange={e => setPurpose(e.target.value)} className={INPUT}>
                {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Host">
              <select value={hostId} onChange={e => selectHost(e.target.value)} className={INPUT}>
                <option value="">Select host…</option>
                {hosts.map(h => <option key={h.id} value={h.id}>{h.full_name}</option>)}
              </select>
            </Field>
            <Field label="Exit Mode">
              <div className="flex gap-3">
                {(['together','individual'] as const).map(mode => (
                  <button key={mode} onClick={() => setExitMode(mode)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${exitMode === mode ? 'border-brand-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                    style={exitMode === mode ? { background: '#16A34A', borderColor: '#16A34A' } : undefined}>
                    {mode === 'together' ? '🤝 Exit Together' : '👤 Individual Exit'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes" className={INPUT} />
            </Field>
          </div>
        )}

        {/* Step 3: Members */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#16A34A' }}>3</div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Additional Members ({members.length})</h2>
            </div>
            {members.map((m, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Member {i + 2}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input value={m.name} onChange={e => setMember(i, 'name', e.target.value)} placeholder="Full name *" className={INPUT} />
                  </div>
                  <input value={m.phone} onChange={e => setMember(i, 'phone', e.target.value)} placeholder="Phone (optional)" className={INPUT} inputMode="numeric" maxLength={10} />
                  <input value={m.id_proof_type} onChange={e => setMember(i, 'id_proof_type', e.target.value)} placeholder="ID type" className={INPUT} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#16A34A' }}>4</div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Confirm Group Entry</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Lead</span>
                <span className="font-semibold text-gray-900 dark:text-white">{leadName} · {leadPhone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Group Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">{groupSize} members</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Purpose</span>
                <span className="font-semibold text-gray-900 dark:text-white">{purpose}</span>
              </div>
              {hostName && <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Host</span>
                <span className="font-semibold text-gray-900 dark:text-white">{hostName}</span>
              </div>}
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">Exit Mode</span>
                <span className="font-semibold text-gray-900 dark:text-white">{exitMode === 'together' ? 'Exit Together' : 'Individual Exit'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Members</p>
              {[{ name: leadName, phone: leadPhone }, ...members].map((m, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: '#16A34A' }}>{i + 1}</div>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{m.name}</span>
                  {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded-md text-white" style={{ background: '#16A34A' }}>Lead</span>}
                  {m.phone && <span className="text-xs text-gray-500 dark:text-gray-400">{m.phone}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => {
              if (step === 1 && (!leadName || !leadPhone)) return toast.error('Name and phone required')
              if (step === 3 && members.some(m => !m.name)) return toast.error('All member names required')
              setStep(s => s + 1)
            }}
              className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: '#16A34A' }}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#16A34A' }}>
              <Users size={16} />
              {submitting ? 'Checking in…' : `Check In ${groupSize} Members`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
