import type { Metadata } from 'next'
import MobileAppClient from '@/components/pages/MobileAppClient'

export const metadata: Metadata = {
  title: 'YesBill Mobile — Android App',
  description:
    'Download the free YesBill Android app. Track daily household services, view your billing calendar, and manage monthly payments — all synced with your web account.',
  alternates: { canonical: '/mobile' },
  openGraph: {
    title: 'YesBill Mobile | Android App',
    description:
      'Everything you love about YesBill, now on Android. Track services, view bills, and chat with AI — perfectly in sync with the web.',
    url: '/mobile',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function MobilePage() {
  return <MobileAppClient />
}
