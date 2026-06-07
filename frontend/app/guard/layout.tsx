import GuardShell from '@/components/guard/GuardShell'

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return <GuardShell>{children}</GuardShell>
}
