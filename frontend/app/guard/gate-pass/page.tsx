'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Truck, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface GatePass {
  id: string
  pass_number: string
  pass_type: 'inward' | 'outward'
  vehicle_number: string
  party_name: string
  status: 'inside' | 'exited' | 'cancelled'
  checked_in_at: string
  items: Array<{ name: string }>
}

const STATUS_STYLE: Record<string, string> = {
  inside:    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  exited:    'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

export default function GatePassHub() {
  const [passes,  setPasses]  = useState<GatePass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/gate-pass?date_from=${today}`)
      .then(r => r.json())
      .then(d => { setPasses(d.gate_passes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const inward  = passes.filter(p => p.pass_type === 'inward').length
  const outward = passes.filter(p => p.pass_type === 'outward').length
  const inside  = passes.filter(p => p.status   === 'inside').length

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Gate Passes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Vehicle entry / exit challan</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/guard/gate-pass/new?type=inward"
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-lg p-5 flex items-center gap-4 transition-all active:scale-[.98] hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <ArrowDownCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">New Inward</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Vehicle entering</p>
          </div>
        </Link>
        <Link href="/guard/gate-pass/new?type=outward"
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 rounded-lg p-5 flex items-center gap-4 transition-all active:scale-[.98] hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <ArrowUpCircle size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">New Outward</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Vehicle leaving</p>
          </div>
        </Link>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Inward',  value: inward,  color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Outward', value: outward, color: 'text-amber-600 dark:text-amber-400'     },
          { label: 'Inside',  value: inside,  color: 'text-brand-600 dark:text-brand-500'     },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today&apos;s passes</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(), 'dd MMM yyyy')}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      ) : passes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
          <Truck size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">No passes today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {passes.map(p => (
            <Link key={p.id} href={`/guard/gate-pass/${p.id}`}
              className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 rounded-xl px-4 py-3 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                p.pass_type === 'inward' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
              }`}>
                {p.pass_type === 'inward'
                  ? <ArrowDownCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                  : <ArrowUpCircle   size={16} className="text-amber-600 dark:text-amber-400"   />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">{p.vehicle_number}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{p.pass_number}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.party_name} · {p.items?.length ?? 0} item{(p.items?.length ?? 0) !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status]}`}>
                  {p.status}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Clock size={10} />{format(new Date(p.checked_in_at), 'HH:mm')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
