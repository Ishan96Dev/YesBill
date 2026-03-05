import type { Metadata } from 'next'
import AnalyticsClient from '@/components/pages/AnalyticsClient'

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
}

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
