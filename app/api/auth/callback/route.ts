import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/assistants';
  
  if (code) {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate user`);
    }
  }

  // URL to redirect to after sign in
  return NextResponse.redirect(`${origin}${next}`);
}
