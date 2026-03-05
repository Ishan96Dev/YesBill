import type { Metadata } from 'next'
import SetupClient from '@/components/pages/SetupClient'

export const metadata: Metadata = {
  title: 'Set Up Your Account',
  robots: { index: false, follow: false },
}

export default function SetupPage() {
  return <SetupClient />
}
