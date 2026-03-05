import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Protected route prefixes ────────────────────────────────────────────────
const PROTECTED = [
  '/dashboard',
  '/services',
  '/add-service',
  '/create-project',
  '/calendar',
  '/bills',
  '/analytics',
  '/settings',
  '/chat',
  '/setup',
]

// ── Auth-only routes (redirect authed users away) ──────────────────────────
const AUTH_ONLY = ['/login', '/signup', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Read Supabase session cookie (set by @supabase/auth-helpers or raw supabase-js)
  const sbAccessToken =
    request.cookies.get('sb-access-token')?.value ||
    // Next-generation cookie names used by supabase-js v2 with storage key
    [...request.cookies.getAll()].find((c) =>
      c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )?.value

  const isAuthed = Boolean(sbAccessToken)

  // Redirect unauthenticated users away from protected routes
  if (!isAuthed && PROTECTED.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authed users away from auth pages
  if (isAuthed && AUTH_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on app + auth routes; skip static files and API
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|avatars|testimonials|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
