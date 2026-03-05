import type { Metadata } from 'next'
import PricingPageClient from '@/components/pages/PricingPageClient'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'YesBill is free to use. No hidden fees, no credit card required. See our transparent pricing plans.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing | YesBill',
    description: 'Free to use. No hidden fees. Transparent billing management for everyone.',
    url: '/pricing',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function PricingPage() {
  return <PricingPageClient />
}
