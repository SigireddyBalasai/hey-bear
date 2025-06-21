import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import type { RequestBody } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

export const GET = requireAuth(async (context, req: NextRequest) => {
  try {
    const supabase = await createClient();

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
      .eq('user_id', context.user.id) // Use auth user ID directly
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
    const customerId = `customer_${context.user.id.replace(/-/g, '')}`;

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
});

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
export const POST = requireAuth(async (context, req: NextRequest) => {
  try {
    const supabase = await createClient();

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
      customer_email,
    } = body;

    // Validate required fields
    if (!business_name || !concierge_name || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name, concierge_name, display_name' },
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
      user_id: context.user.id,
      assistant_config_data: assistantConfigData,
      customer_email: customer_email || context.user.email,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };

    const { data: paymentSession, error: insertError } = await supabase
      .from('payment_sessions')
      .insert([paymentSessionData])
      .select('*')
      .single();

    if (insertError) {
      console.error(
        'Error creating payment session (insert using user-context client):',
        insertError
      );

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
});
