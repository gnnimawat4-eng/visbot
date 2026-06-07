'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquare, User, Clock, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { maskPhone } from '@/lib/sms'

interface SmsLog {
  id: string
  type: 'entry' | 'exit'
  recipient_name: string | null
  recipient_phone: string | null
  message: string | null
  status: string
  created_at: string
}

interface CheckIn {
  id: string
  purpose: string
  host_name: string
  host_phone: string | null
  photo_url: string | null
  status: 'checked_in' | 'checked_out'
  checked_out_at: string | null
  created_at: string
  visitor: { name: string; phone: string; email: string | null } | null
}

export default function VisitorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [checkin,  setCheckin]  = useState<CheckIn | null>(null)
  const [smsLogs,  setSmsLogs]  = useState<SmsLog[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/visitors/${id}`)
      .then(r => r.json())
      .then(d => {
        setCheckin(d.checkin ?? null)
        setSmsLogs(d.sms_logs ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!checkin) {
    return (
      <div className="text-center py-20 text-sm text-gray-400">
        Visit not found.{' '}
        <button onClick={() => router.back()} className="text-brand-500 hover:underline">← Go back</button>
      </div>
    )
  }

  const entrySms = smsLogs.find(l => l.type === 'entry')
  const exitSms  = smsLogs.find(l => l.type === 'exit')

  return (
    <>
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Visitors
      </button>

      {/* Visitor card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          {checkin.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={checkin.photo_url} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            : <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-xl font-bold text-brand-600 flex-shrink-0">
                <User size={24} />
              </div>
          }
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{checkin.visitor?.name ?? '—'}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">{maskPhone(checkin.visitor?.phone ?? '')}</p>
            {checkin.visitor?.email && <p className="text-xs text-gray-400 dark:text-gray-500">{checkin.visitor.email}</p>}
          </div>
          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
            checkin.status === 'checked_in' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {checkin.status === 'checked_in' ? '● Checked In' : 'Checked Out'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
            <p className="text-gray-900 dark:text-gray-100 capitalize font-medium">{checkin.purpose}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Host</p>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{checkin.host_name}</p>
            {checkin.host_phone && <p className="text-xs text-gray-400 dark:text-gray-500">{maskPhone(checkin.host_phone)}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Entry</p>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{format(new Date(checkin.created_at), 'dd MMM yyyy')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(checkin.created_at), 'HH:mm')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Exit</p>
            {checkin.checked_out_at
              ? <>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{format(new Date(checkin.checked_out_at), 'dd MMM yyyy')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(checkin.checked_out_at), 'HH:mm')}</p>
                </>
              : <p className="text-gray-400 dark:text-gray-500">—</p>
            }
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SMS Notifications</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Demo mode</span>
        </div>

        {smsLogs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No SMS logs for this visit.</p>
        ) : (
          <div className="space-y-3">
            {/* Entry SMS */}
            <div className={`rounded-lg border px-4 py-3 ${entrySms ? 'border-green-100 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className={entrySms ? 'text-green-600' : 'text-gray-400'} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Entry Notification</span>
                {entrySms
                  ? <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Demo</span>
                  : <span className="ml-auto text-xs text-gray-400">Not sent</span>
                }
              </div>
              {entrySms ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    To visitor: <span className="font-mono">{maskPhone(entrySms.recipient_phone ?? '')}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">&ldquo;{entrySms.message}&rdquo;</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{format(new Date(entrySms.created_at), 'dd MMM HH:mm')}</p>
                </>
              ) : (
                <p className="text-xs text-gray-400">Entry SMS was not logged for this visit.</p>
              )}
            </div>

            {/* Exit SMS */}
            <div className={`rounded-lg border px-4 py-3 ${exitSms ? 'border-orange-100 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <LogOut size={13} className={exitSms ? 'text-orange-600' : 'text-gray-400'} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exit Notification</span>
                {exitSms
                  ? <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Demo</span>
                  : <span className="ml-auto text-xs text-gray-400">{checkin.status === 'checked_in' ? 'Pending exit' : 'Not sent'}</span>
                }
              </div>
              {exitSms ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    To host: <span className="font-medium">{exitSms.recipient_name}</span>{' '}
                    <span className="font-mono">{maskPhone(exitSms.recipient_phone ?? '')}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{exitSms.message}&rdquo;</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(exitSms.created_at), 'dd MMM HH:mm')}</p>
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  {checkin.status === 'checked_in'
                    ? 'Host will be notified when visitor exits.'
                    : checkin.host_phone
                      ? 'Exit SMS was not logged.'
                      : 'No host phone — exit SMS skipped.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
