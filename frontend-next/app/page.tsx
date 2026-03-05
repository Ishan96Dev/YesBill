// ── SSG Landing page — rendered at build time, fully SEO-indexed ─────────────
// This is a React Server Component (no "use client").
// Interactive parts (Navbar CTA, email-change banner detection) are moved to
// client sub-components imported below.
import type { Metadata } from 'next'
import LandingClient from '@/components/landing/LandingClient'

export const metadata: Metadata = {
  title: 'YesBill — Daily Billing Tracker',
  description:
    'Track your daily services and automate monthly billing. Simple, transparent, and effective billing management for households and service providers.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'YesBill — Daily Billing Tracker',
    description:
      'Track your daily services and automate monthly billing. Simple, transparent, and effective.',
    url: '/',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
}

// Tell Next.js to statically generate this page at build time (SSG)
export const dynamic = 'force-static'

export default function LandingPage() {
  return <LandingClient />
}
