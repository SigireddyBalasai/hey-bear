import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStripeInstance } from '@/lib/stripe';
import { headers } from 'next/headers';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';



export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');

    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing required parameter: assistantId' }, { status: 400 });
    }
    
    const supabase = await createClient();
    const header = await headers();
    const origin = header.get('origin') || 'http://localhost:3000';

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user record from users table
    const { data: userData, error: userDataError } = await supabase
      .schema('users')
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
    }
    
    // Fetch the assistant to check ownership and current plan
    const { data: assistantData, error: assistantError } = await supabase
      .schema('assistants')
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'No-Show not found' }, { status: 404 });
    }
    
    // Ensure the assistant belongs to the authenticated user
    if (assistantData.user_id !== userData.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this No-Show' }, { status: 403 });
    }
    
    // Check if the assistant already has a Business plan
    // Note: Since the database doesn't have a params field, we need to fetch subscription data separately
    
    // Fetch subscription data for the assistant
    // Using a type assertion to bypass type constraints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptionData } = await (supabase as any)
      .from('assistant_subscriptions')
      .select('plan_id')
      .eq('assistant_id', assistantId)
      .single();
      
    if (subscriptionData?.plan_id === 'business') {
      return NextResponse.json({ error: 'No-Show is already on the Business plan' }, { status: 400 });
    }
    
    // Create a new customer in Stripe or use existing one
    let customerId;
    
    const userDataWithStripe = userData as typeof userData & { stripe_customer_id?: string };
    if (userDataWithStripe.stripe_customer_id) {
      // Use existing customer
      customerId = userDataWithStripe.stripe_customer_id;
    } else {
      // Create a new customer
      const stripeInstance = getStripeInstance();
      if (!stripeInstance) {
        throw new Error('Could not initialize Stripe client');
      }
      const customer = await stripeInstance.customers.create({
        email: user.email,
        name: user.email, // Use email as name if full_name is not available
        metadata: {
          supabaseUserId: userData.id
        }
      });
      
      customerId = customer?.id;
      
      // Update user record with Stripe customer ID
      // Use a type-safe approach since the stripe_customer_id field might not be in the type definition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { stripe_customer_id: customerId };
      await supabase
        .schema('users')
        .from('users')
        .update(updateData)
        .eq('id', userData.id);
    }
    
    // Get Business plan details to determine price
    const businessPlan = SUBSCRIPTION_PLANS.BUSINESS;
    const priceInCents = Math.round(businessPlan.price * 100);
    
    // Check if there's an existing subscription to cancel
    let existingSubscriptionId;
    // Fetch subscription data for the assistant if available - use type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSubscription } = await (supabase as any)
      .from('assistant_subscriptions')
      .select('stripe_subscription_id')
      .eq('assistant_id', assistantId)
      .single();
      
    // Safe type checking
    if (existingSubscription && typeof existingSubscription === 'object' && 'stripe_subscription_id' in existingSubscription) {
      existingSubscriptionId = existingSubscription.stripe_subscription_id;
    }
    
    // Create a checkout session for the Business plan
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
            product: businessPlan.id || '',
            unit_amount: priceInCents,
            recurring: {
              interval: 'month'
            }
          }
        }
      ],
      mode: 'subscription',
      success_url: `${origin}/Concierge?success=true&upgraded=true&session_id={CHECKOUT_SESSION_ID}&assistant_id=${assistantId}`,
      cancel_url: `${origin}/Concierge?canceled=true&assistant_id=${assistantId}`,
      metadata: {
        assistantId: assistantId,
        userId: userData.id,
        upgradeFlow: 'true'
      },
      subscription_data: {
        metadata: {
          assistantId: assistantId,
          userId: userData.id,
          upgradeFlow: 'true',
          previousSubscriptionId: existingSubscriptionId || ''
        }
      }
    });
    
    // If the user already has a subscription, we'll cancel it after successful upgrade
    // via the webhook handler (see subscription.created webhook handler)
    
    // Redirect to the checkout page
    return NextResponse.redirect(session?.url || `${origin}/Concierge?error=checkout_failed`);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Plan upgrade error:', error);
    return NextResponse.json({ 
      error: 'Failed to create upgrade session',
      details: errorMessage 
    }, { status: 500 });
  }
}