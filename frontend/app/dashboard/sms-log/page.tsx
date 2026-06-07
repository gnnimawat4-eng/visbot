'use client'
import { useCallback, useEffect, useState } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { maskPhone } from '@/lib/sms'

interface SmsLog {
  id: string; type: 'entry' | 'exit'; recipient_name: string | null
  recipient_phone: string | null; message: string | null; status: string; created_at: string
}

const today = () => new Date().toISOString().split('T')[0]

export default function SmsLogPage() {
  const [logs,     setLogs]     = useState<SmsLog[]>([])
  const [loading,  setLoading]  = useState(true)
  const [typeFilter, setType]   = useState('')
  const [dateFrom,  setDateFrom] = useState(today())
  const [dateTo,    setDateTo]   = useState(today())

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (typeFilter) p.set('type', typeFilter)
    if (dateFrom)   p.set('date_from', dateFrom)
    if (dateTo)     p.set('date_to', dateTo)
    const res  = await fetch(`/api/dashboard/sms-log?${p}`)
    const data = await res.json()
    setLogs(data.logs ?? [])
    setLoading(false)
  }, [typeFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const entry  = logs.filter(l => l.type === 'entry').length
  const exit   = logs.filter(l => l.type === 'exit').length

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">SMS Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{entry} entry · {exit} exit notifications · <span className="text-blue-600 font-medium">Demo mode</span></p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Demo mode banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800">
        <strong>Demo Mode:</strong> No real SMS is sent. All notifications are logged here for testing. To enable real SMS, add <code className="bg-blue-100 px-1 rounded text-xs">FAST2SMS_API_KEY</code> and update <code className="bg-blue-100 px-1 rounded text-xs">lib/sms.ts</code>.
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 mb-4 flex flex-wrap gap-3">
        <select value={typeFilter} onChange={e => setType(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All types</option>
          <option value="entry">Entry</option>
          <option value="exit">Exit</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              {['Type', 'Recipient', 'Phone', 'Message', 'Status', 'Time'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded" /></td></tr>)
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <MessageSquare size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No SMS logs yet. Try a visitor check-in or exit.</p>
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      log.type === 'entry' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {log.type === 'entry' ? '↓ Entry' : '↑ Exit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{log.recipient_name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {log.recipient_phone ? maskPhone(log.recipient_phone) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate text-xs">{log.message ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">Demo</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {format(new Date(log.created_at), 'dd MMM HH:mm')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
