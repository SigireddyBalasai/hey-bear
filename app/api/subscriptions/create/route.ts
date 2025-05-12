import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

// Type definition for user data
interface UserData {
  id: string;
  auth_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_active: string | null;
  is_admin: boolean | null;
  plan_id: string | null;
  metadata?: { stripe_customer_id?: string; full_name?: string };
}

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { assistantId, planId } = body;
    
    // Validate required fields
    if (!assistantId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    
    // Fetch the pending assistant directly from assistants table with pending=true flag
    const { data: pendingAssistant, error: pendingError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .eq('pending', true)
      .single();
    
    if (pendingError || !pendingAssistant) {
      console.error('Error fetching pending assistant:', pendingError);
      return NextResponse.json({ error: 'Pending assistant not found' }, { status: 404 });
    }
    
    // Ensure the assistant belongs to the authenticated usercated user
    if (pendingAssistant.user_id !== userData.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this assistant' }, { status: 403 });
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
    
    // Get plan details to determine price
    const { getSubscriptionPlanDetails } = await import('@/lib/stripe');
    const planDetails = getSubscriptionPlanDetails(planId);
    const priceInCents = planDetails ? Math.round(planDetails.price * 100) : 1000;
    
    // Create a checkout session with the product ID
    const session = await stripe?.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          quantity:1,
          price_data: {
            currency: 'usd',
            product: planId,
            unit_amount: priceInCents,
            recurring: {
              interval: 'month'
            }
          }
        }
      ],
      mode: 'subscription',
      success_url: `${origin}/Concierge?success=true&session_id={CHECKOUT_SESSION_ID}&assistant_id=${assistantId}`,
      cancel_url: `${origin}/Concierge?canceled=true&assistant_id=${assistantId}`,
      metadata: {
        pendingAssistantId: assistantId,
        userId: userData.id
      },
      subscription_data: {
        metadata: {
          pendingAssistantId: assistantId,
          userId: userData.id
        }
      }
    });
    
    // Update the pending assistant with the checkout session information
    const { error: updateError } = await supabase
      .from('assistants')
      .update({
        params: {
          ...(typeof pendingAssistant.params === 'object' && pendingAssistant.params !== null ? pendingAssistant.params : {}),
          checkout: {
            sessionId: session?.id,
            createdAt: new Date().toISOString(),
            status: 'pending'
          }
        }
      })
      .eq('id', assistantId);
      
    if (updateError) {
      console.error('Error updating pending assistant:', updateError);
      return NextResponse.json({ error: 'Failed to update pending assistant with checkout data' }, { status: 500 });
    }

    // Return the checkout URL to redirect the user
    return NextResponse.json({ 
      success: true,
      checkoutUrl: session?.url,
      sessionId: session?.id
    });
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
}