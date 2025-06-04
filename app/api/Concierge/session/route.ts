import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/server-admin';

interface RequestBody {
  business_name: string;
  business_phone?: string;
  concierge_name: string;
  description?: string;
  display_name: string;
  pinecone_name?: string;
  share_phone_number?: boolean;
  system_prompt?: string;
  plan_id: string;
  customer_email?: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user record from users table to get the correct user_id
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userFetchError || !userData) {
      console.error('Error fetching user record:', userFetchError);
      return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
    }

    // Get session ID from query params
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Fetch payment session data using the application user ID
    const { data: paymentSession, error: fetchError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userData.id) // Use application user ID instead of auth user ID
      .single();

    if (fetchError || !paymentSession) {
      console.error('Error fetching payment session:', fetchError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is expired
    if (paymentSession.expires_at && new Date(paymentSession.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 410 });
    }

    // For now, we'll create a simple customer ID based on user ID
    // In a production environment, you'd want to create/retrieve actual Stripe customers
    const customerId = `customer_${user.id.replace(/-/g, '')}`;

    return NextResponse.json({
      sessionId: paymentSession.session_id,
      customerId,
      status: paymentSession.status,
      planId: paymentSession.plan_id,
      assistantConfig: paymentSession.assistant_config_data,
    });
  } catch (error) {
    console.error('Unexpected error in session retrieval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// IMPORTANT DATABASE SCHEMA NOTE:
// The successful operation of this POST handler, especially the insertion into 'payment_sessions',
// depends on the database schema matching the state defined after the migration
// 'supabase/migrations/20250603120000_fix_payment_sessions_user_id_fkey.sql'.
// Specifically:
// 1. The 'payment_sessions.user_id' column MUST reference 'public.users.id' (the application user ID).
// 2. The RLS policy "Users can insert their own payment sessions" ON 'public.payment_sessions'
//    MUST validate against 'public.users.auth_user_id' matching 'auth.uid()', and use the
//    'public.users.id' for the 'user_id' field being inserted.
// If these conditions are not met (e.g., if the 'payment_sessions.user_id' still references 'auth.users.id'
// or RLS policies are outdated), this endpoint may return a 500 error with the message
// "Failed to create payment session" due to RLS check failures.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient(); // Initialize admin client
    let userData: { id: string } | null = null;
    let userFetchError: any = null;
    const maxRetries = 3;
    const retryDelay = 500; // ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`ADMIN_CLIENT: Attempt ${attempt}/${maxRetries} to fetch user record from 'public.users' for auth_user_id: ${user.id}`);
      const { data: currentData, error: currentError } = await adminSupabase // Use adminSupabase here
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (currentData && !currentError) {
        userData = currentData;
        userFetchError = null;
        console.log(`ADMIN_CLIENT: Successfully fetched user record on attempt ${attempt}. User ID: ${userData.id}`);
        break; // Exit loop on success
      } else {
        userData = null;
        userFetchError = currentError;
        console.warn(`ADMIN_CLIENT: Failed to fetch user record on attempt ${attempt}. Error: ${currentError?.message || 'No data returned'}`);
        if (attempt < maxRetries) {
          console.log(`ADMIN_CLIENT: Waiting ${retryDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
      
    if (!userData) { // This means all retries failed
      console.error(`ADMIN_CLIENT: Failed to fetch user record from 'public.users' after ${maxRetries} attempts for auth_user_id: ${user.id}. Last error:`, userFetchError);
      return NextResponse.json({ error: 'Failed to fetch user record from public.users using admin client after multiple attempts. Please try again shortly.' }, { status: 500 });
    }
    // At this point, userData is guaranteed to be non-null and contain { id: string }
    // userData.id now comes from a read performed by adminSupabase.

    // Parse request body
    const body = (await req.json()) as RequestBody;
    const {
      business_name,
      business_phone,
      concierge_name,
      description,
      display_name,
      pinecone_name,
      share_phone_number = false,
      system_prompt,
      plan_id,
      customer_email,
    } = body;

    // Validate required fields
    if (!business_name || !concierge_name || !display_name || !plan_id) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name, concierge_name, display_name, plan_id' },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = uuidv4();

    // Create assistant config data snapshot
    const assistantConfigData = {
      business_name,
      business_phone,
      concierge_name,
      description,
      display_name,
      pinecone_name,
      share_phone_number,
      system_prompt,
    };

    // Create payment session record using the application user ID, not auth user ID
    const paymentSessionData: Database['public']['Tables']['payment_sessions']['Insert'] = {
      session_id: sessionId,
      user_id: userData.id, // Use application user ID instead of auth user ID
      assistant_config_data: assistantConfigData,
      plan_id,
      customer_email: customer_email || user.email,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };

    const { data: paymentSession, error: insertError } = await supabase
      .from('payment_sessions')
      .insert([paymentSessionData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating payment session (insert using user-context client):', insertError);
      return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      payment_session_id: paymentSession.id,
      message: 'Payment session created successfully',
    });
  } catch (error) {
    console.error('Unexpected error in session creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
