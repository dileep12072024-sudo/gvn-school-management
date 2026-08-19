import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

// Authentication only. Role authorisation lives in the dashboard layout
// (which already loads the profile) and, authoritatively, in Postgres RLS.
// Doing a profile lookup here would add a DB round-trip to every request.

const PUBLIC_PATHS = ['/login', '/landing', '/auth/callback']

export async function middleware(req: NextRequest) {
  // Server components can't see the URL, and the dashboard layout needs it to
  // decide whether this role may view this route.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  const supabase = createMiddlewareClient({ req, res })

  // Also refreshes an expiring session and writes the new cookie onto `res`.
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!session && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    // Come back here after signing in.
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (session && pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    // Everything except Next internals, the auth API, and static assets.
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
