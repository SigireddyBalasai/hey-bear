import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getStripeInstance } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(_req: NextRequest) {
  try {
    // Check user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user record from users table
    const { data: userData, error: userDataError } = await supabase
      .schema('users')
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
    }

    // Check for existing customer profile with Stripe customer ID
    const { data: customerProfile, error: profileError } = await supabase
      .schema('users')
      .from('customer_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userData.id)
      .single();

    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not initialized' }, { status: 500 });
    }

    // Create or get existing Stripe customer
    let customerId;

    if (!profileError && customerProfile.stripe_customer_id) {
      // Use existing customer
      customerId = customerProfile.stripe_customer_id;
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.email,
        metadata: {
          supabaseUserId: userData.id,
        },
      });

      customerId = customer.id;

      // Create or update customer profile with Stripe customer ID
      await supabase.schema('users').from('customer_profiles').upsert({
        user_id: userData.id,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      });
    }

    // Create customer session for pricing table
    const customerSession = await stripe.customerSessions.create({
      customer: customerId,
      components: {
        pricing_table: {
          enabled: true,
        },
      },
    });

    return NextResponse.json({
      customer_session_client_secret: customerSession.client_secret,
    });
  } catch (error: unknown) {
    console.error('Customer session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create customer session',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
