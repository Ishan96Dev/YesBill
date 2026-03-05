import type { Metadata } from 'next'
import LoginClient from '@/components/pages/LoginClient'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your YesBill account.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginClient />
}
