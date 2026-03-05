export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import ForgotPasswordClient from '@/components/pages/ForgotPasswordClient'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your YesBill account password.',
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
