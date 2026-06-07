'use client'
import { useState, useEffect } from 'react'
import type { CompanyBranding } from '@/lib/pdfBranding'

// Module-level cache: key '' = own company, key '<id>' = specific company
const cache = new Map<string, { data: CompanyBranding; ts: number }>()
const TTL = 5 * 60 * 1000

export function useCompanyBranding(companyId?: string): CompanyBranding | null {
  const [branding, setBranding] = useState<CompanyBranding | null>(null)

  useEffect(() => {
    const key = companyId ?? ''
    const url = companyId
      ? `/api/dashboard/company?id=${companyId}`
      : '/api/dashboard/company'

    const hit = cache.get(key)
    if (hit && Date.now() - hit.ts < TTL) {
      setBranding(hit.data)
      return
    }

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        cache.set(key, { data: d as CompanyBranding, ts: Date.now() })
        setBranding(d as CompanyBranding)
      })
      .catch(() => {})
  }, [companyId])

  return branding
}

/** Invalidate the branding cache (call after saving branding changes) */
export function invalidateBrandingCache(companyId?: string) {
  cache.delete(companyId ?? '')
}
