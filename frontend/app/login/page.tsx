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

const C = {
  bg:          '#0A0A0A',
  accent:      '#536878',
  text:        '#E5E4E2',
  textFaint:   'rgba(229,228,226,0.3)',
  textMuted:   'rgba(229,228,226,0.5)',
  borderBase:  'rgba(83,104,120,0.3)',
  cardBorder:  'rgba(83,104,120,0.15)',
} as const

export default function LoginPage() {
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

  return (
    <main
      style={{
        minHeight:      '100vh',
        background:     C.bg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '1.5rem',
        position:       'relative',
        overflow:       'hidden',
      }}
    >
      {/* ── Glow orb ── */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          width:      '500px',
          height:     '500px',
          background: 'radial-gradient(circle, rgba(83,104,120,0.4) 0%, transparent 70%)',
          filter:     'blur(80px)',
          zIndex:     0,
          pointerEvents: 'none',
        }}
      />

      {/* ── Card ── */}
      <div
        style={{
          position:           'relative',
          zIndex:             1,
          width:              '100%',
          maxWidth:           '400px',
          padding:            '40px',
          borderRadius:       '1.25rem',
          border:             `1px solid ${C.cardBorder}`,
          backdropFilter:     'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1 }}>
            <span style={{ color: C.text }}>Vis</span>
            <span style={{ color: C.accent }}>Bot</span>
          </div>
          <p style={{
            marginTop:      '10px',
            fontSize:       '0.6875rem',
            letterSpacing:  '0.18em',
            textTransform:  'uppercase',
            color:          C.accent,
          }}>
            Visitor Management, Reimagined
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Email */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display:       'block',
              fontSize:      '0.6875rem',
              fontWeight:    500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color:         C.textMuted,
              marginBottom:  '10px',
            }}>
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="obsidian-input"
              style={{
                width:           '100%',
                background:      'transparent',
                border:          'none',
                borderBottom:    `1px solid ${C.borderBase}`,
                outline:         'none',
                color:           C.text,
                fontSize:        '0.9375rem',
                padding:         '8px 0',
                transition:      'border-color 200ms ease',
                boxSizing:       'border-box',
              }}
              onFocus={e  => { e.currentTarget.style.borderBottomColor = C.accent }}
              onBlur={e   => { e.currentTarget.style.borderBottomColor = C.borderBase }}
            />
            {errors.email && (
              <p style={{ marginTop: '5px', fontSize: '0.75rem', color: '#f87171' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '36px' }}>
            <label style={{
              display:       'block',
              fontSize:      '0.6875rem',
              fontWeight:    500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color:         C.textMuted,
              marginBottom:  '10px',
            }}>
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="obsidian-input"
              style={{
                width:        '100%',
                background:   'transparent',
                border:       'none',
                borderBottom: `1px solid ${C.borderBase}`,
                outline:      'none',
                color:        C.text,
                fontSize:     '0.9375rem',
                padding:      '8px 0',
                transition:   'border-color 200ms ease',
                boxSizing:    'border-box',
              }}
              onFocus={e  => { e.currentTarget.style.borderBottomColor = C.accent }}
              onBlur={e   => { e.currentTarget.style.borderBottomColor = C.borderBase }}
            />
            {errors.password && (
              <p style={{ marginTop: '5px', fontSize: '0.75rem', color: '#f87171' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Sign-in button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:          '100%',
              padding:        '13px',
              background:     C.accent,
              color:          C.bg,
              fontWeight:     600,
              fontSize:       '0.9375rem',
              borderRadius:   '8px',
              border:         'none',
              cursor:         loading ? 'not-allowed' : 'pointer',
              opacity:        loading ? 0.65 : 1,
              transition:     'background 300ms ease',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.text }}
            onMouseLeave={e => { e.currentTarget.style.background = C.accent }}
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              : 'Sign in'
            }
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop:  '28px',
          textAlign:  'center',
          fontSize:   '0.6875rem',
          color:      C.textFaint,
          letterSpacing: '0.03em',
        }}>
          Secure visitor management by VisBot
        </p>
      </div>
    </main>
  )
}
