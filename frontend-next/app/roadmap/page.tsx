import type { Metadata } from 'next'
import RoadmapPageClient from '@/components/pages/RoadmapPageClient'

export const metadata: Metadata = {
  title: 'Roadmap',
  description:
    "See what's coming next for YesBill — features in development, planned improvements, and upcoming releases.",
  alternates: { canonical: '/roadmap' },
  openGraph: {
    title: "Roadmap | YesBill",
    description: "Upcoming features and improvements planned for YesBill.",
    url: '/roadmap',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function RoadmapPage() {
  return <RoadmapPageClient />
}
