export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import SettingsTabClient from '@/components/pages/SettingsTabClient'

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return <SettingsTabClient />
}
