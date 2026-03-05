import type { Metadata } from 'next'
import PrivacyPageClient from '@/components/pages/PrivacyPageClient'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the YesBill Privacy Policy. We are committed to protecting your personal data and privacy.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy | YesBill',
    description: 'How YesBill collects, uses, and protects your personal information.',
    url: '/privacy',
  },
  robots: { index: true, follow: false },
}

export const dynamic = 'force-static'

export default function PrivacyPage() {
  return <PrivacyPageClient />
}
