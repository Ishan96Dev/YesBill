// Dashboard — protected, fully client-side
// Charts (recharts) loaded via dynamic import to avoid SSR window issues.
import type { Metadata } from 'next'
import DashboardClient from '@/components/pages/DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return <DashboardClient />
}
