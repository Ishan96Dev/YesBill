export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import SettingsClient from '@/components/pages/SettingsClient'

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <SettingsClient />
}
