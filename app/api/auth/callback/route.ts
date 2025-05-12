import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/Concierge';
  
  if (code) {
    const supabase = await createClient();
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error: any) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/login?error=${error.message}`);
    }
  }

  // URL to redirect to after sign in
  return NextResponse.redirect(`${origin}${next}`);
}
