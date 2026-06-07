'use client'
import { useEffect, useRef, useState } from 'react'
import { Star, Ban, Search, Plus } from 'lucide-react'

interface Vendor {
  id: string; name: string; vendor_code: string; phone: string | null
  contact_person: string | null; city: string | null; vendor_type: string
  is_preferred: boolean; is_blacklisted: boolean; gst_number: string | null
}

interface Props {
  value: string
  vendorId: string | null
  onChange: (name: string, vendor: Vendor | null) => void
  placeholder?: string
  className?: string
}

export function VendorAutocomplete({ value, vendorId, onChange, placeholder = 'Vendor name…', className = '' }: Props) {
  const [query, setQuery]     = useState(value)
  const [results, setResults] = useState<Vendor[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/vendors/search?q=${encodeURIComponent(query)}`)
      const d = await res.json()
      setResults(d.vendors ?? [])
      setOpen(true)
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(v: Vendor) {
    setQuery(v.name)
    setOpen(false)
    onChange(v.name, v)
  }

  function handleChange(val: string) {
    setQuery(val)
    onChange(val, null)
  }

  const INPUT_BASE = `w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 pr-9`

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true) }}
        placeholder={placeholder}
        className={`${INPUT_BASE} ${className}`}
      />
      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No vendors found</div>
          )}
          {results.map(v => (
            <button key={v.id} onClick={() => select(v)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{v.name}</span>
                  {v.is_preferred && <Star size={11} className="text-amber-400 fill-amber-400" />}
                  {v.is_blacklisted && <Ban size={11} className="text-red-500" />}
                </div>
                <div className="flex gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>{v.vendor_code}</span>
                  {v.city && <span>· {v.city}</span>}
                  {v.phone && <span>· {v.phone}</span>}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">{v.vendor_type}</span>
            </button>
          ))}
          <button onClick={() => { setOpen(false); window.open('/dashboard/vendors/new', '_blank') }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium transition-colors border-t border-gray-100 dark:border-gray-800">
            <Plus size={14} /> Add new vendor
          </button>
        </div>
      )}
    </div>
  )
}
