import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/Concierge';

  if (code) {
    const supabase = await createClient();

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error: unknown) {
      console.error('Error exchanging code for session:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.redirect(`${origin}/login?error=${errorMessage}`);
    }
  }

  // URL to redirect to after sign in
  return NextResponse.redirect(`${origin}${next}`);
}
