import type { Metadata } from 'next'
import FeaturesPageClient from '@/components/pages/FeaturesPageClient'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Discover all YesBill features — daily service tracking, automated bill generation, AI-powered chat, multi-currency support, analytics, and more.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'Features | YesBill',
    description:
      'Daily service tracking, automated bills, AI chat, analytics — everything you need to manage billing effortlessly.',
    url: '/features',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function FeaturesPage() {
  return <FeaturesPageClient />
}
