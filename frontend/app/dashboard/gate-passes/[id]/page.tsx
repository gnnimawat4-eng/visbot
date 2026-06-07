'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Printer, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCompanyBranding } from '@/hooks/useCompanyBranding'
import { GatePassDocument } from '@/components/shared/GatePassDocument'
import type { GatePassData } from '@/components/shared/GatePassDocument'

// ─── Extended type (includes photo fields not in the printable doc) ────────────

interface GatePass extends GatePassData {
  status: 'inside' | 'exited' | 'cancelled'
  vehicle_photo_url: string | null
  document_photo_url: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GatePassDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const branding = useCompanyBranding()

  const [gp,      setGp]      = useState<GatePass | null>(null)
  const [loading, setLoading] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    fetch(`/api/gate-pass/${id}`)
      .then(r => r.json())
      .then(d => { setGp(d.gate_pass ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const markExited = async () => {
    if (!gp) return
    setExiting(true)
    const res = await fetch(`/api/gate-pass/${id}/exit`, { method: 'PATCH' })
    if (res.ok) {
      const data = await res.json()
      setGp(prev => prev ? { ...prev, ...data.gate_pass } : prev)
      toast.success('Marked as exited')
    } else {
      toast.error('Failed to update status')
    }
    setExiting(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-32 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    )
  }

  if (!gp) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm mb-4">Gate pass not found.</p>
        <Link href="/dashboard/gate-passes" className="text-brand-500 text-sm hover:underline">
          ← Back to Gate Passes
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* ── Action buttons (hidden in print) ───────────────────────────────── */}
      <div className="no-print flex items-center justify-between mb-5">
        <Link
          href="/dashboard/gate-passes"
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-2">
          {gp.status === 'inside' && (
            <button
              onClick={markExited}
              disabled={exiting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {exiting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Mark Exited
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Gate pass document ─────────────────────────────────────────────── */}
      <GatePassDocument gp={gp} branding={branding} />
    </>
  )
}
