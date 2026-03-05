export const dynamic = 'force-dynamic'
// /services/[serviceId]/calendar — CSR + generateStaticParams placeholder.
// serviceId values are user-specific (Supabase) so we cannot pre-enumerate them
// at build time. We return an empty array and fall back to full CSR at runtime.
import type { Metadata } from 'next'
import ServiceCalendarClient from '@/components/pages/ServiceCalendarClient'

export const metadata: Metadata = {
  title: 'Service Calendar',
  robots: { index: false, follow: false },
}

// Required by Next.js when output:'export' is set — not needed on Vercel but
// left here as a no-op so the file is valid in both modes.
export function generateStaticParams() {
  return []
}

export default function ServiceCalendarPage() {
  return <ServiceCalendarClient />
}
