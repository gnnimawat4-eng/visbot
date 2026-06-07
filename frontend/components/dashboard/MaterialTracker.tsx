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
  const [items,   setItems]   = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/materials?pending=true')
      .then(r => r.json())
      .then(d => { setItems(d.materials ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '20px' }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: '#0A0A0A' }}>Pending Material Returns</h2>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 rounded-lg" style={{ background: '#F5F5F5' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>No pending returns</p>
      ) : (
        <div>
          {items.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between py-2.5 -mx-1 px-1 rounded-lg transition-colors"
              style={{ borderBottom: '1px solid #F5F5F5' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span className="text-sm font-medium truncate flex-1" style={{ color: '#0A0A0A' }}>
                {m.item_name}
              </span>
              <span className="text-xs mx-3" style={{ color: '#9CA3AF' }}>{m.quantity}×</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#FEF2F2', color: '#DC2626' }}
              >
                OUT
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
