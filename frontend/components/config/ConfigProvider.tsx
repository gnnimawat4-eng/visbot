'use client'
import { useEffect, useState } from 'react'
import { ConfigContext, CompanyConfig, DEFAULT_CONFIG } from '@/lib/config'

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<CompanyConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    fetch('/api/config/current')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.config) setConfig({ ...DEFAULT_CONFIG, ...d.config }) })
      .catch(() => {})
  }, [])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}
