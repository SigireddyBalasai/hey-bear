import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';

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
      console.error('Error creating payment session:', insertError);
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
