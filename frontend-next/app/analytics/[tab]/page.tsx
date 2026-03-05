export const dynamic = 'force-dynamic'
// /analytics/[tab] — tabs: overview | trends | services
import type { Metadata } from 'next'
import AnalyticsTabClient from '@/components/pages/AnalyticsTabClient'

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  return [{ tab: 'overview' }, { tab: 'trends' }, { tab: 'services' }]
}

export default function AnalyticsTabPage({
  params,
}: {
  params: { tab: string }
}) {
  return <AnalyticsTabClient tab={params.tab} />
}
