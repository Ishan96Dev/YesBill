// Auth callback handler — Supabase redirects here after OAuth or magic-link auth.
// Must be CSR because it reads the URL hash and calls supabase.auth.exchangeCodeForSession().
import type { Metadata } from 'next'
import AuthCallbackClient from '@/components/pages/AuthCallbackClient'

export const metadata: Metadata = {
  title: 'Authenticating…',
  robots: { index: false, follow: false },
}

export default function AuthCallbackPage() {
  return <AuthCallbackClient />
}
