import type { Metadata } from 'next'
import ContactPageClient from '@/components/pages/ContactPageClient'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the YesBill team. We are here to help with questions, feedback, or support.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact | YesBill',
    description: 'Reach out to the YesBill team for support, feedback, or any questions.',
    url: '/contact',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-static'

export default function ContactPage() {
  return <ContactPageClient />
}
