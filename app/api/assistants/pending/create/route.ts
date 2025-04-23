import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { TablesInsert } from '@/lib/db.types';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { assistantName, description, params, plan } = body;
    
    // Validate required fields
    if (!assistantName || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const header = await headers()
    const origin = header.get('origin') || 'http://localhost:3000';

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user record from users table
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userFetchError || !userData) {
      console.error('Error fetching user record:', userFetchError);
      return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
    }

    // Generate a unique ID for the pending assistant
    const pendingAssistantId = uuidv4();

    // Store pending assistant in the database
    const pendingAssistantData: TablesInsert<'pending_assistants'> = {
      id: pendingAssistantId,
      user_id: userData.id,
      name: assistantName,
      params: {
        description: description || 'No description provided',
        ...params,
        plan: plan
      },
      created_at: new Date().toISOString(),
      plan_id: plan === 'business' ? 
        process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PLAN_ID || process.env.STRIPE_BUSINESS_PLAN_ID :
        process.env.NEXT_PUBLIC_STRIPE_PERSONAL_PLAN_ID || process.env.STRIPE_PERSONAL_PLAN_ID
    };

    const { error: insertError } = await supabase
      .from('pending_assistants')
      .insert(pendingAssistantData);

    if (insertError) {
      console.error('Error creating pending assistant:', insertError);
      return NextResponse.json({ error: 'Failed to create pending assistant' }, { status: 500 });
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
    const planDetails = getSubscriptionPlanDetails(pendingAssistantData.plan_id || undefined);
    const priceInCents = planDetails ? Math.round(planDetails.price * 100) : 1000;
    
    // Ensure stripe is initialized
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }

    // Ensure customer ID is valid
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Failed to create or retrieve Stripe customer ID');
    }

    // Ensure we have a valid customer ID string
    if (!customerId) {
      throw new Error('Invalid customer ID');
    }
    
    // Create a checkout session with the product ID
    // Since we've already validated customerId is not null or undefined 
    // and is a string type, we can use it directly
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: pendingAssistantData.plan_id || "",
            unit_amount: priceInCents,
            recurring: {
              interval: 'month'
            }
          }
        }
      ],
      mode: 'subscription',
      success_url: `${origin}/Concierge?success=true&session_id={CHECKOUT_SESSION_ID}&pending_assistant_id=${pendingAssistantId}`,
      cancel_url: `${origin}/Concierge?canceled=true&pending_assistant_id=${pendingAssistantId}`,
      metadata: {
        pendingAssistantId: pendingAssistantId,
        userId: userData.id
      },
      subscription_data: {
        metadata: {
          pendingAssistantId: pendingAssistantId,
          userId: userData.id
        }
      }
    });
    
    // Update the pending assistant with checkout session details
    await supabase
      .from('pending_assistants')
      .update({
        checkout_session_id: session?.id
      })
      .eq('id', pendingAssistantId);

    // Return success with checkout URL
    return NextResponse.json({
      success: true,
      pendingAssistantId,
      checkoutUrl: session?.url,
      sessionId: session?.id
    });
  } catch (error: any) {
    console.error('Error creating pending assistant:', error);
    return NextResponse.json({ 
      error: 'Failed to create pending assistant',
      details: error.message 
    }, { status: 500 });
  }
}
