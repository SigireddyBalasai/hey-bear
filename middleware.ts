import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { trackApiUsage } from '@/utils/analytics/api-tracker'

export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname

  // Apply API tracking to all API routes
  if (path.startsWith('/api/')) {
    trackApiUsage(request, path)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
