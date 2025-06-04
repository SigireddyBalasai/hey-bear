import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createCustomerSession, getOrCreateStripeCustomer } from '@/utils/stripe-customer';
import { createClient } from '@/utils/supabase/server';

export async function POST(_req: NextRequest) {
  try {
    // Check user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: authError.message,
        },
        { status: 401 }
      );
    }

    if (!user?.email) {
      return NextResponse.json(
        {
          error: 'User not authenticated or email missing',
        },
        { status: 401 }
      );
    }
    console.log('Authenticated user:', user.id, user.email);
    // Get user record from users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    console.log('User data fetched:', userData);

    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json(
        {
          error: 'Failed to fetch user record',
          details: userDataError?.message || 'User record not found in database',
        },
        { status: userDataError ? 500 : 404 }
      );
    }

    // Validate required user data
    if (!userData.id || typeof userData.id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid user data',
          details: 'User ID is missing or invalid',
        },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerResult = await getOrCreateStripeCustomer(
      supabase,
      userData.id as string,
      user.id,
      user.email,
      (userData.full_name as string) || user.email
    );

    // Validate customer ID before creating session
    if (!customerResult.customerId) {
      return NextResponse.json(
        {
          error: 'Failed to get customer ID',
          details: 'Unable to create or retrieve Stripe customer',
        },
        { status: 500 }
      );
    }

    // Create customer session for pricing table
    const sessionResult = await createCustomerSession(customerResult.customerId);

    return NextResponse.json({
      customer_session_client_secret: sessionResult.clientSecret,
      customer_id: customerResult.customerId,
      is_new_customer: customerResult.isNewCustomer || false,
    });
  } catch (error: unknown) {
    console.error('Customer session creation error:', error);

    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Handle specific Stripe errors
      if (errorMessage.includes('no such customer')) {
        return NextResponse.json(
          {
            error: 'Customer not found in payment system',
            details: 'Please try again or contact support',
            code: 'CUSTOMER_NOT_FOUND',
          },
          { status: 404 }
        );
      }

      if (errorMessage.includes('invalid api key') || errorMessage.includes('unauthorized')) {
        console.error('Stripe API key configuration error');
        return NextResponse.json(
          {
            error: 'Payment system configuration error',
            details: 'Service temporarily unavailable',
            code: 'STRIPE_CONFIG_ERROR',
          },
          { status: 500 }
        );
      }

      if (errorMessage.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            details: 'Please try again in a moment',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        );
      }

      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Network error',
            details: 'Please check your connection and try again',
            code: 'NETWORK_ERROR',
          },
          { status: 503 }
        );
      }

      if (errorMessage.includes('database') || errorMessage.includes('supabase')) {
        return NextResponse.json(
          {
            error: 'Database error',
            details: 'Unable to access user data',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to create customer session',
          details: error.message,
          code: 'CUSTOMER_SESSION_ERROR',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: 'Please try again later',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
