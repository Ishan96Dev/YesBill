import type { Metadata } from 'next'
import TermsPageClient from '@/components/pages/TermsPageClient'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the YesBill Terms of Service. Understand your rights and responsibilities when using our platform.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service | YesBill',
    description: 'Terms and conditions for using the YesBill platform.',
    url: '/terms',
  },
  robots: { index: true, follow: false },
}

export const dynamic = 'force-static'

export default function TermsPage() {
  return <TermsPageClient />
}
