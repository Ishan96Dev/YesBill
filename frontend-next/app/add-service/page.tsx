import type { Metadata } from 'next'
import AddServiceClient from '@/components/pages/AddServiceClient'

export const metadata: Metadata = {
  title: 'Add Service',
  robots: { index: false, follow: false },
}

export default function AddServicePage() {
  return <AddServiceClient />
}
