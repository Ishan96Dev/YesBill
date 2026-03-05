export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import BillsClient from '@/components/pages/BillsClient'

export const metadata: Metadata = {
  title: 'Bills',
  robots: { index: false, follow: false },
}

export default function BillsPage() {
  return <BillsClient />
}
