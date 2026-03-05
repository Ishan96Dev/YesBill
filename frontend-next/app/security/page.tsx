import type { Metadata } from 'next'
import SecurityPageClient from '@/components/pages/SecurityPageClient'

export const metadata: Metadata = {
  title: 'Security',
  description:
    'Learn how YesBill protects your data — encryption, Supabase Row-Level Security, and security best practices.',
  alternates: { canonical: '/security' },
  openGraph: {
    title: 'Security | YesBill',
    description: 'How YesBill keeps your billing data safe and secure.',
    url: '/security',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function SecurityPage() {
  return <SecurityPageClient />
}
