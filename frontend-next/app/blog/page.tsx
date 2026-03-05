import type { Metadata } from 'next'
import BlogPageClient from '@/components/pages/BlogPageClient'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Tips, guides, and insights on daily billing, service management, and financial transparency from the YesBill team.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog | YesBill',
    description:
      'Billing tips, service management guides, and product updates from the YesBill team.',
    url: '/blog',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function BlogPage() {
  return <BlogPageClient />
}
