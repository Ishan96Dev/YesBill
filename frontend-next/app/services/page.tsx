export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import ServicesClient from '@/components/pages/ServicesClient'

export const metadata: Metadata = {
  title: 'My Services',
  robots: { index: false, follow: false },
}

export default function ServicesPage() {
  return <ServicesClient />
}
