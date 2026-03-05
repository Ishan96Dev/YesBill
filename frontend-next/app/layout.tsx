import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toaster-custom'
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// ── Site-wide default metadata ── (each page can override via generateMetadata)
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yesbill.vercel.app'
  ),
  title: {
    default: 'YesBill — Daily Billing Tracker',
    template: '%s | YesBill',
  },
  description:
    'Track your daily services and automate monthly billing. Simple, transparent, and effective.',
  keywords: ['billing', 'daily tracker', 'service management', 'invoice', 'subscription'],
  authors: [{ name: 'Ishan Chakraborty' }],
  creator: 'Ishan Chakraborty',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'YesBill',
    title: 'YesBill — Daily Billing Tracker',
    description:
      'Track your daily services and automate monthly billing. Simple, transparent, and effective.',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: 'YesBill' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YesBill — Daily Billing Tracker',
    description: 'Track your daily services and automate monthly billing.',
    images: ['/assets/og-image.png'],
    creator: '@ishan96dev',
  },
  icons: {
    icon: '/assets/branding/yesbill_logo_icon_only.png',
    shortcut: '/assets/branding/yesbill_logo_icon_only.png',
    apple: '/assets/branding/yesbill_logo_icon_only.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans selection:bg-primary/20 text-gray-900 bg-background">
        <ErrorBoundaryWrapper>
          <ToastProvider>{children}</ToastProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}
