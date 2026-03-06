import { createServerClient } from '@supabase/ssr'
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
  '/support',
]

// ── Auth-only routes (redirect authed users away) ──────────────────────────
// NOTE: /forgot-password is intentionally NOT in this list so that
// authenticated users (e.g. Google OAuth users without a password) can
// still request a password reset email.
const AUTH_ONLY = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  // Start with a passthrough response so we can attach refreshed cookies
  const response = NextResponse.next({ request })

  // createServerClient reads/writes session cookies — requires @supabase/ssr
  // (createBrowserClient used in lib/supabase.ts stores the session in cookies
  //  automatically, so the middleware can now reliably detect auth state)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with Supabase — never trust a stale cookie
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthed = !!user
  const { pathname } = request.nextUrl

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

  return response
}

export const config = {
  // Run middleware on app + auth routes; skip static files and API
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|avatars|testimonials|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
