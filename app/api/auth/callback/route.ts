import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // For typing the request object

import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/lib/db.types'; // For audit log type

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

      // Audit logging starts here
      try {
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();

        if (getUserError || !user) {
          console.error('Error fetching user after session exchange for audit logging:', getUserError?.message);
          // Do not block login, proceed to redirect
        } else {
          // Fetch application user ID (from public.users)
          const { data: appUser, error: appUserError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

          if (appUserError || !appUser) {
            console.error('Error fetching app user ID for audit log (auth_user_id:', user.id, '):', appUserError?.message);
            // Skip audit log if app user not found, but still redirect.
          } else {
            const appUserId = appUser.id;

            const auditLogEntry: Database['public']['Tables']['audit_logs']['Insert'] = {
              entity_id: appUserId, // The user who is signing in
              entity_type: 'user',
              action: 'user_signed_in',
              performed_by: appUserId, // User performed their own sign-in
              details: { ip_address: request.ip ?? null }, // Store IP address if available, otherwise null
              // Ensure created_at and action_timestamp are handled by db default or set here if needed.
              // They have default values in db.types.ts, so they should be fine.
            };

            const { error: auditError } = await supabase.from('audit_logs').insert([auditLogEntry]);
            if (auditError) {
              console.error('Error inserting sign-in audit log for user:', appUserId, auditError.message);
              // Do not block login for audit log failure.
            } else {
              console.log('User sign-in audit log created for user:', appUserId);
            }
          }
        }
      } catch (auditRelatedError: unknown) {
        // Catch any unexpected errors during the audit logging process
        console.error('Unexpected error during audit logging:', auditRelatedError instanceof Error ? auditRelatedError.message : String(auditRelatedError));
        // Do not block login for audit log failure.
      }
      // End of audit logging

    } catch (error: unknown) { // This catch is for exchangeCodeForSession primarily now
      console.error('Generic error in auth callback:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during login.';
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
