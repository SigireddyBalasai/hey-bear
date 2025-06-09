import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// For typing the request object

import { createClient } from '@/utils/supabase/server';

// It's good practice to type the request if you use it, NextRequest is more specific than Request
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Ensure 'next' is a relative path to prevent open redirect vulnerabilities.
  // Default to '/Concierge' if 'next' is missing or invalid.
  let next = searchParams.get('next') ?? '/Concierge';
  if (next.startsWith('//') || next.startsWith('http')) {
    console.warn(`Invalid 'next' parameter detected: ${next}. Defaulting to /Concierge.`);
    next = '/Concierge';
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError.message);
        // Redirect to login page with a generic error or specific one if desired
        return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
      }
    } catch (error: unknown) {
      // This catch is for exchangeCodeForSession primarily now
      console.error('Generic error in auth callback:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred during login.';
      // It's generally better to redirect to a generic error page or login page with an error query param
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  } else {
    // Handle missing code parameter
    console.warn('Auth callback called without a code parameter.');
    return NextResponse.redirect(`${origin}/login?error=Missing authentication code`);
  }

  // URL to redirect to after sign in
  return NextResponse.redirect(`${origin}${next}`);
}
