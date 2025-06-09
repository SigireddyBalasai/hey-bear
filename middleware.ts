import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authenticate } from '@/utils/auth-utils';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const sessionResponse = await updateSession(request);

  if (sessionResponse.status === 307 || sessionResponse.headers.get('location')) {
    return sessionResponse;
  }

  if (pathname.startsWith('/admin')) {
    try {
      const authResult = await authenticate(true);
      if (!authResult.success) {
        return NextResponse.redirect(new URL('/sign-in?error=admin-required', request.url));
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      return NextResponse.redirect(new URL('/sign-in?error=auth-failed', request.url));
    }
  }

  if (
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/twilio/') ||
    pathname.match(/^\/api\/(dashboard|assistant|Concierge)/)
  ) {
    console.log(`API request to protected route: ${pathname}`);
  }

  return sessionResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
