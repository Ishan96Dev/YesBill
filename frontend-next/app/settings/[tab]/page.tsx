// /settings/[tab] — tabs: profile | billing | notifications | security | ai
import type { Metadata } from 'next'
import SettingsTabClient from '@/components/pages/SettingsTabClient'

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  return [
    { tab: 'profile' },
    { tab: 'billing' },
    { tab: 'notifications' },
    { tab: 'security' },
    { tab: 'ai' },
  ]
}

export default function SettingsTabPage({
  params,
}: {
  params: { tab: string }
}) {
  return <SettingsTabClient tab={params.tab} />
}
