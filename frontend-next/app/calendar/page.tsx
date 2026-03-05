import type { Metadata } from 'next'
import CalendarViewClient from '@/components/pages/CalendarViewClient'

export const metadata: Metadata = {
  title: 'Calendar',
  robots: { index: false, follow: false },
}

export default function CalendarPage() {
  return <CalendarViewClient />
}
