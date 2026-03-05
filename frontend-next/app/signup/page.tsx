import type { Metadata } from 'next'
import SignupClient from '@/components/pages/SignupClient'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free YesBill account and start tracking billing today.',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return <SignupClient />
}
