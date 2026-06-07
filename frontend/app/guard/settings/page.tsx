'use client'
import { Palette } from 'lucide-react'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'

export default function GuardSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Guard portal preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette size={18} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Auto follows your system setting</p>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}
