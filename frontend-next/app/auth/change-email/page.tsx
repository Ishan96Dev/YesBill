export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import ChangeEmailClient from '@/components/pages/ChangeEmailClient'

export const metadata: Metadata = {
  title: 'Confirm Email Change',
  robots: { index: false, follow: false },
}

export default function ChangeEmailPage() {
  return <ChangeEmailClient />
}
