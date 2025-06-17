import { NextResponse } from 'next/server';

import { requireAuth } from '@/utils/auth-utils';
import {
  createCustomerSession,
  getOrCreateStripeCustomerFromAuth,
} from '@/utils/stripe-customer-auth';
import { createClient as createAdminClient } from '@/utils/supabase/server-admin';

export const POST = requireAuth(async context => {
  try {
    if (!context.user?.email) {
      return NextResponse.json(
        {
          error: 'User not authenticated or email missing',
        },
        { status: 401 }
      );
    }
    console.log('Authenticated user:', context.user.id, context.user.email);

    const adminSupabase = await createAdminClient();
    const customerResult = await getOrCreateStripeCustomerFromAuth(adminSupabase, context.user);

    console.log('Customer result:', customerResult);

    if (!customerResult.success || !customerResult.customerId) {
      return NextResponse.json(
        {
          error: 'Failed to get customer ID',
          details: customerResult.error || 'Unable to create or retrieve Stripe customer',
        },
        { status: 500 }
      );
    }

    const sessionResult = await createCustomerSession(customerResult.customerId);

    if (!sessionResult.success || !sessionResult.clientSecret) {
      return NextResponse.json(
        {
          error: 'Failed to create customer session',
          details: sessionResult.error || 'Unable to create Stripe customer session',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customer_session_client_secret: sessionResult.clientSecret,
      customer_id: customerResult.customerId,
      is_new_customer: customerResult.isNewCustomer || false,
    });
  } catch (error: unknown) {
    console.error('Customer session creation error:', error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

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
});
