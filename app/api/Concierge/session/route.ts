import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';

import type { RequestBody } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/server-admin';

export const GET = async (req: NextRequest) => {
  const supabase = await createClient();
  let user = null;

  try {
    user = await supabase.auth.getUser();
    if (user.error) {
      console.error('[GET /api/Concierge/session] Authentication error:', user.error);
      return NextResponse.json({ error: 'Unauthorized', details: user.error.message || user.error }, { status: 401 });
    }
    if (!user) {
      console.warn('[GET /api/Concierge/session] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized', details: 'No authenticated user found' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    console.info('[GET /api/Concierge/session] sessionId:', sessionId);

    if (!sessionId) {
      console.warn('[GET /api/Concierge/session] Missing sessionId in query params');
      return NextResponse.json({ error: 'Session ID is required', details: 'Missing sessionId in query params' }, { status: 400 });
    }

    const { data: paymentSession, error: fetchError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.data.user.id)
      .single();

    if (fetchError || !paymentSession) {
      console.error('[GET /api/Concierge/session] Error fetching payment session:', fetchError);
      return NextResponse.json({ error: 'Session not found', details: fetchError?.message || fetchError || 'No session found for this user and sessionId' }, { status: 404 });
    }

    if (paymentSession.expires_at && new Date(paymentSession.expires_at) < new Date()) {
      console.info('[GET /api/Concierge/session] Session expired:', paymentSession.session_id);
      return NextResponse.json({ error: 'Session expired', details: 'The payment session has expired.' }, { status: 410 });
    }

    const customerId = `customer_${user.data.user.id.replace(/-/g, '')}`;
    console.info('[GET /api/Concierge/session] Returning session info for user:', user.data.user.id);

    return NextResponse.json({
      sessionId: paymentSession.session_id,
      customerId,
      status: paymentSession.status,
      planId: paymentSession.plan_id,
      assistantConfig: paymentSession.assistant_config_data,
    });
  } catch (error) {
    console.error('[GET /api/Concierge/session] Unexpected error:', error, 'User:', user?.data?.user?.id);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
};

// "Failed to create payment session" due to RLS check failures.
export const POST = async (req: NextRequest) => {
  // 1. Get user with user-context client
  const userClient = await createClient();
  const { data: authUser, error: authError } = await userClient.auth.getUser();
  if (authError || !authUser.user) {
    return NextResponse.json({ error: 'Unauthorized', details: authError?.message || authError || 'No authenticated user' }, { status: 401 });
  }
  const user = authUser.user;

  // 2. Use admin client for the insert
  const adminClient = await createAdminClient();

  try {
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

    console.info('[POST /api/Concierge/session] Received body:', {
      business_name,
      business_phone,
      concierge_name,
      description,
      display_name,
      pinecone_name,
      share_phone_number,
      system_prompt,
      customer_email,
    });

    if (!business_name || !concierge_name || !display_name) {
      console.warn('[POST /api/Concierge/session] Missing required fields', {
        business_name,
        concierge_name,
        display_name,
      });
      return NextResponse.json(
        { error: 'Missing required fields: business_name, concierge_name, display_name', details: { business_name, concierge_name, display_name } },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();
    console.info('[POST /api/Concierge/session] Generated sessionId:', sessionId);

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

    const paymentSessionData: Database['public']['Tables']['payment_sessions']['Insert'] = {
      session_id: sessionId,
      user_id: user.id,
      assistant_config_data: assistantConfigData,
      customer_email: customer_email ?? user.email,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    console.info('[POST /api/Concierge/session] Inserting payment session:', paymentSessionData);

    const { data: paymentSession, error: insertError } = await adminClient
      .from('payment_sessions')
      .insert([paymentSessionData])
      .select('*')
      .single();

    if (insertError) {
      console.error(
        '[POST /api/Concierge/session] Error creating payment session (insert using user-context client):',
        insertError,
        'User:', user.id
      );
      return NextResponse.json({ error: 'Failed to create payment session', details: insertError?.message || insertError }, { status: 500 });
    }

    console.info('[POST /api/Concierge/session] Payment session created:', {
      session_id: sessionId,
      payment_session_id: paymentSession.id,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      payment_session_id: paymentSession.id,
      message: 'Payment session created successfully',
    });
  } catch (error) {
    console.error('[POST /api/Concierge/session] Unexpected error:', error, 'User:', user?.id);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
};
