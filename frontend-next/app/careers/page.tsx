import type { Metadata } from 'next'
import CareersPageClient from '@/components/pages/CareersPageClient'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join the YesBill team — open positions, our culture, and how to apply.',
  alternates: { canonical: '/careers' },
  openGraph: {
    title: 'Careers | YesBill',
    description: 'Work with us at YesBill — open positions and company culture.',
    url: '/careers',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function CareersPage() {
  return <CareersPageClient />
}
