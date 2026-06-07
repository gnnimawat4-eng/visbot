'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DayCount { date: string; count: number }

export function VisitChart() {
  const [data, setData] = useState<DayCount[]>([])

  useEffect(() => {
    const supabase = createClient()
    const since = new Date()
    since.setDate(since.getDate() - 6)

    supabase
      .from('checkins')
      .select('created_at')
      .gte('created_at', since.toISOString())
      .then(({ data: rows }) => {
        const counts: Record<string, number> = {}
        for (let i = 0; i < 7; i++) {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          counts[d.toISOString().split('T')[0]] = 0
        }
        rows?.forEach(r => {
          const day = (r.created_at as string).split('T')[0]
          if (day in counts) counts[day]++
        })
        setData(Object.entries(counts).map(([date, count]) => ({ date, count })))
      })
  }, [])

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Visits — last 7 days</p>
      <div className="flex items-end gap-2 h-28">
        {data.map(({ date, count }) => (
          <div key={date} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full bg-emerald-100 dark:bg-emerald-500/20 rounded-t transition-all"
              style={{ height: `${Math.max((count / max) * 96, count > 0 ? 8 : 2)}px` }}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
