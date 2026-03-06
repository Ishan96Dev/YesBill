export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import SupportClient from '@/components/pages/SupportClient'

export const metadata: Metadata = {
  title: 'Support',
  robots: { index: false, follow: false },
}

export default function SupportPage() {
  return <SupportClient />
}
