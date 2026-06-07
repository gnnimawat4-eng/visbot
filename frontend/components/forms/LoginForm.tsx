'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type FormData = z.infer<typeof schema>

export function LoginForm() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await createClient().auth.signInWithPassword(data)
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/')
    }
  }

  const inputCls = [
    'w-full h-10 px-3 rounded-md text-sm outline-none transition-shadow',
    'border',
  ].join(' ')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium" style={{ color: 'var(--vb-text-2)' }}>
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={inputCls}
          style={{
            background:  'var(--vb-input)',
            borderColor: 'var(--vb-input-border)',
            color:       'var(--vb-text)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--vb-text)'
            e.currentTarget.style.boxShadow   = '0 0 0 3px var(--vb-accent-ring)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--vb-input-border)'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium" style={{ color: 'var(--vb-text-2)' }}>
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputCls}
          style={{
            background:  'var(--vb-input)',
            borderColor: 'var(--vb-input-border)',
            color:       'var(--vb-text)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--vb-text)'
            e.currentTarget.style.boxShadow   = '0 0 0 3px var(--vb-accent-ring)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--vb-input-border)'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
        style={{ background: 'var(--vb-text)', color: 'var(--vb-bg)' }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : 'Sign in'}
      </button>
    </form>
  )
}
