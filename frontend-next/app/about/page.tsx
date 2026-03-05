import type { Metadata } from 'next'
import AboutPageClient from '@/components/pages/AboutPageClient'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about YesBill — the story, the mission, and the team behind the daily billing tracker.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About | YesBill',
    description: 'The story and mission behind YesBill — making billing transparent for everyone.',
    url: '/about',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function AboutPage() {
  return <AboutPageClient />
}
