import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { PaymentSessionData } from '@/types/api.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

export const POST = requireAuth(async (context, request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { user } = context;

    const sessionData = (await request.json()) as PaymentSessionData;

    // Validate required fields
    if (!sessionData.sessionId || !sessionData.assistantName || !sessionData.businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, assistantName, businessName' },
        { status: 400 }
      );
    }

    // Insert payment session data
    const { data, error } = await supabase
      .from('payment_sessions')
      .insert({
        session_id: sessionData.sessionId,
        user_id: user.id,
        stripe_customer_id: sessionData.stripeCustomerId,
        assistant_config_data: {
          display_name: sessionData.displayName,
          business_name: sessionData.businessName,
          description: sessionData.assistantDescription,
          concierge_name: sessionData.conciergeName,
          business_phone: sessionData.businessPhone,
          personality: sessionData.personality,
          share_phone_number: sessionData.sharePhoneNumber ?? false,
        },
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error storing payment session:', error);

      return NextResponse.json({ error: 'Failed to store payment session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentSessionId: data.id,
      message: 'Payment session stored successfully',
    });
  } catch (error) {
    console.error('Error in payment session storage:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// Retrieve payment session data
export const GET = requireAuth(async (context, request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { user } = context;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve payment session data
    const { data, error } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.error('Error retrieving payment session:', error);

      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sessionData: data,
    });
  } catch (error) {
    console.error('Error in payment session retrieval:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
