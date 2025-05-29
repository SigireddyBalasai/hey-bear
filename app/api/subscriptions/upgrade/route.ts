import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SUBSCRIPTION_PLANS, getStripeInstance } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Missing required parameter: assistantId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const header = await headers();
    const origin = header.get('origin') ?? 'http://localhost:3000';

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userDataError } = await supabase
      .schema('users')
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
    }

    const { data: assistantData, error: assistantError } = await supabase
      .schema('assistants')
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'No-Show not found' }, { status: 404 });
    }

    if (assistantData.user_id !== userData.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this No-Show' },
        { status: 403 }
      );
    }

    const { data: subscriptionData } = await supabase
      .schema('assistants')
      .from('assistant_subscriptions')
      .select('plan_id')
      .eq('assistant_id', assistantId)
      .single();

    if (subscriptionData?.plan_id === 'business') {
      return NextResponse.json(
        { error: 'No-Show is already on the Business plan' },
        { status: 400 }
      );
    }

    let customerId;

    const userDataWithStripe = userData as typeof userData & { stripe_customer_id?: string };
    if (userDataWithStripe.stripe_customer_id) {
      customerId = userDataWithStripe.stripe_customer_id;
    } else {
      const stripeInstance = getStripeInstance();
      if (!stripeInstance) {
        throw new Error('Could not initialize Stripe client');
      }
      const customer = await stripeInstance.customers.create({
        email: user.email,
        name: user.email,
        metadata: {
          supabaseUserId: userData.id,
        },
      });

      customerId = customer.id;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { stripe_customer_id: customerId };
      await supabase.schema('users').from('users').update(updateData).eq('id', userData.id);
    }

    const businessPlan = SUBSCRIPTION_PLANS.BUSINESS;
    const priceInCents = Math.round(businessPlan.price * 100);

    let existingSubscriptionId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSubscription } = await (supabase as any)
      .from('assistant_subscriptions')
      .select('stripe_subscription_id')
      .eq('assistant_id', assistantId)
      .single();

    if (
      existingSubscription &&
      typeof existingSubscription === 'object' &&
      'stripe_subscription_id' in existingSubscription
    ) {
      existingSubscriptionId = existingSubscription.stripe_subscription_id;
    }

    const stripeInstance = getStripeInstance();
    if (!stripeInstance) {
      throw new Error('Could not initialize Stripe client');
    }
    const session = await stripeInstance.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product: businessPlan.id ?? '',
            unit_amount: priceInCents,
            recurring: {
              interval: 'month',
            },
          },
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/Concierge?success=true&upgraded=true&session_id={CHECKOUT_SESSION_ID}&assistant_id=${assistantId}`,
      cancel_url: `${origin}/Concierge?canceled=true&assistant_id=${assistantId}`,
      metadata: {
        assistantId: assistantId,
        userId: userData.id,
        upgradeFlow: 'true',
      },
      subscription_data: {
        metadata: {
          assistantId: assistantId,
          userId: userData.id,
          upgradeFlow: 'true',
          previousSubscriptionId: existingSubscriptionId ?? '',
        },
      },
    });

    return NextResponse.redirect(session.url ?? `${origin}/Concierge?error=checkout_failed`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Plan upgrade error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create upgrade session',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
