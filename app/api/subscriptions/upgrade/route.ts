import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

// Helper function for type checking params.subscription
const hasSubscription = (params: any): params is { subscription: { stripeSubscriptionId?: string, plan?: string } } => {
  return typeof params === 'object' && 
         params !== null && 
         'subscription' in params && 
         typeof params.subscription === 'object' &&
         params.subscription !== null;
};

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
    if (hasSubscription(assistantData.params) && 
        assistantData.params.subscription.plan === 'business') {
      return NextResponse.json({ error: 'No-Show is already on the Business plan' }, { status: 400 });
    }
    
    // Create a new customer in Stripe or use existing one
    let customerId;
    
    if (typeof userData.metadata === 'object' && 
        userData.metadata !== null && 
        'stripe_customer_id' in userData.metadata) {
      // Use existing customer
      customerId = userData.metadata.stripe_customer_id as string;
    } else {
      // Create a new customer
      const customer = await stripe?.customers.create({
        email: user.email,
        name: user.email, // Use email as name if full_name is not available
        metadata: {
          supabaseUserId: userData.id
        }
      });
      
      customerId = customer?.id;
      
      // Update user record with Stripe customer ID
      await supabase
        .from('users')
        .update({
          metadata: {
            ...(typeof userData.metadata === 'object' && userData.metadata !== null ? userData.metadata : {}),
            stripe_customer_id: customerId
          }
        })
        .eq('id', userData.id);
    }
    
    // Get Business plan details to determine price
    const businessPlan = SUBSCRIPTION_PLANS.BUSINESS;
    const priceInCents = Math.round(businessPlan.price * 100);
    
    // Check if there's an existing subscription to cancel
    let existingSubscriptionId;
    if (hasSubscription(assistantData.params)) {
      existingSubscriptionId = assistantData.params.subscription.stripeSubscriptionId;
    }
    
    // Create a checkout session for the Business plan
    const session = await stripe?.checkout.sessions.create({
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
    
  } catch (error: any) {
    console.error('Plan upgrade error:', error);
    return NextResponse.json({ 
      error: 'Failed to create upgrade session',
      details: error.message 
    }, { status: 500 });
  }
}