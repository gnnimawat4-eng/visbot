'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldOff, LogOut } from 'lucide-react'

export default function NoAccessPage() {
  const router = useRouter()

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={28} className="text-red-400" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">No access</h1>
        <p className="text-sm text-gray-500 mb-1">
          Your account has not been set up in VisBot.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Contact your administrator to get access.
        </p>

        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>

        <p className="mt-8 text-xs text-gray-300">
          Vis<span className="text-brand-400">Bot</span>
        </p>
      </div>
    </main>
  )
}
