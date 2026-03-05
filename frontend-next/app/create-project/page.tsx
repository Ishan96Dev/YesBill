export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import CreateProjectClient from '@/components/pages/CreateProjectClient'

export const metadata: Metadata = {
  title: 'Create Project',
  robots: { index: false, follow: false },
}

export default function CreateProjectPage() {
  return <CreateProjectClient />
}
