// Setup flow removed — profiles are created by the system.
// All users are created by an Owner or Admin with the correct role already set.
import { redirect } from 'next/navigation'

export default function AuthSetupPage() {
  redirect('/login')
}
