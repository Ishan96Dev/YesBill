export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import ResetPasswordClient from '@/components/pages/ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Set New Password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
