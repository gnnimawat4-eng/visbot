'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

const CYCLE: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' }

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const icon = theme === 'light'
    ? <Sun  className="w-4 h-4" />
    : theme === 'dark'
      ? <Moon className="w-4 h-4" />
      : resolvedTheme === 'dark'
        ? <Monitor className="w-4 h-4" />
        : <Monitor className="w-4 h-4" />

  return (
    <button
      onClick={() => setTheme(CYCLE[theme ?? 'system'] ?? 'light')}
      aria-label="Cycle theme"
      style={{ color: 'var(--vb-text-3)' }}
      className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {icon}
    </button>
  )
}
