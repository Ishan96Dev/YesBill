import type { Metadata } from 'next'
import TestimonialsPageClient from '@/components/pages/TestimonialsPageClient'

export const metadata: Metadata = {
  title: 'Testimonials',
  description:
    'See what households and service providers say about YesBill — real stories from real users.',
  alternates: { canonical: '/testimonials' },
  openGraph: {
    title: 'Testimonials | YesBill',
    description: 'Real stories from households and service providers who use YesBill every day.',
    url: '/testimonials',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function TestimonialsPage() {
  return <TestimonialsPageClient />
}
