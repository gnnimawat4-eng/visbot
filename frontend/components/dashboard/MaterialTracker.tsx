'use client'
import { useEffect, useState } from 'react'

interface Material {
  id: string
  item_name: string
  quantity: number
  direction: 'in' | 'out'
  return_expected: boolean
  returned_at: string | null
  created_at: string
}

export function MaterialTracker() {
  const [items, setItems]     = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/materials?pending=true')
      .then(r => r.json())
      .then(d => { setItems(d.materials ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Pending material returns</h2>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No pending returns</p>
      ) : (
        <div className="space-y-0">
          {items.map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0 text-sm">
              <span className="text-gray-800 dark:text-gray-200 font-medium truncate flex-1">{m.item_name}</span>
              <span className="text-gray-400 dark:text-gray-500 text-xs mx-3">{m.quantity}×</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">OUT</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
