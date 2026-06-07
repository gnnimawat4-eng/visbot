'use client'
import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface GroupMember { id: string; member_name: string; member_phone: string | null; is_lead: boolean; status: string; checked_in_at: string; checked_out_at: string | null }
interface Group {
  id: string; group_code: string; lead_name: string; lead_phone: string; group_size: number
  purpose: string; host_name: string | null; status: string; exit_mode: string
  created_at: string; checked_out_at: string | null; notes: string | null
  members: GroupMember[]
}

function Skeleton() {
  return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-lg animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
}

function elapsed(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

export default function GroupsPage() {
  const [groups, setGroups]   = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('status', filter)
    fetch(`/api/groups?${params}`).then(r => r.json()).then(d => { setGroups(d.groups ?? []); setLoading(false) })
  }, [filter])

  const active   = groups.filter(g => g.status === 'checked_in').length
  const total    = groups.length
  const avgSize  = total ? Math.round(groups.reduce((s, g) => s + g.group_size, 0) / total) : 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Group Visits</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage group check-ins and exits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Groups', value: total, icon: Users, color: 'text-blue-500' },
          { label: 'Currently Inside', value: active, icon: Clock, color: 'text-green-500' },
          { label: 'Avg Group Size', value: avgSize, icon: Users, color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={15} className={s.color} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[{ key: '', label: 'All' }, { key: 'checked_in', label: '🟢 Active' }, { key: 'checked_out', label: '✓ Exited' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton /> : groups.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No group visits found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
              {/* Summary row */}
              <button onClick={() => setExpanded(prev => prev === g.id ? null : g.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ background: g.status === 'checked_in' ? '#16A34A' : '#6b7280' }}>
                  {g.group_size}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{g.group_code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{g.purpose}</span>
                    {g.status === 'checked_in'
                      ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Active</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Exited</span>
                    }
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Lead: {g.lead_name} · {g.group_size} members · {g.host_name ? `Host: ${g.host_name}` : 'No host'} · {elapsed(g.created_at)}
                  </div>
                </div>
                {expanded === g.id ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
              </button>

              {/* Expanded members */}
              {expanded === g.id && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Members</h4>
                  <div className="space-y-2">
                    {g.members?.map(m => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'checked_in' ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.member_name}</span>
                        {m.is_lead && <span className="text-xs px-1.5 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 rounded-md">Lead</span>}
                        {m.member_phone && <span className="text-xs text-gray-500 dark:text-gray-400">{m.member_phone}</span>}
                        {m.status === 'checked_out' && m.checked_out_at && (
                          <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                            <CheckCircle size={10} /> {new Date(m.checked_out_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
