import { LoginForm } from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--vb-bg)' }}
    >
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--vb-text)' }}>
            Vis<span style={{ color: 'var(--vb-accent)' }}>Bot</span>
          </span>
          <p className="mt-2 text-sm" style={{ color: 'var(--vb-text-3)' }}>
            Sign in to your portal
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-lg p-6"
          style={{
            background:  'var(--vb-bg-card)',
            border:      '1px solid var(--vb-border)',
          }}
        >
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--vb-text-3)' }}>
          Secure visitor management by VisBot
        </p>
      </div>
    </main>
  )
}
