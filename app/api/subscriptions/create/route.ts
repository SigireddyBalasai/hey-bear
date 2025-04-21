import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';

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
    
    // Fetch the assistant to make sure it belongs to this user
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }
    
    // Ensure the assistant belongs to the authenticated user
    if (assistantData.user_id !== userData.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this assistant' }, { status: 403 });
    }
    
    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.email, // Use email as name if full_name is not available
      metadata: {
        supabaseUserId: userData.id
      }
    });
    
    const customerId = customer.id;
    
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: planId,
      }],
      metadata: {
        assistantId: assistantId,
        userId: userData.id
      }
    });
    
    // Safely extract existing params
    let existingParams = {};
    let existingSubscription = {};
    
    if (assistantData.params && 
        typeof assistantData.params === 'object' && 
        assistantData.params !== null) {
      existingParams = assistantData.params as Record<string, any>;
      
      if ('subscription' in (assistantData.params as Record<string, any>) && 
          typeof (assistantData.params as Record<string, any>).subscription === 'object' && 
          (assistantData.params as Record<string, any>).subscription !== null) {
        existingSubscription = (assistantData.params as Record<string, any>).subscription;
      }
    }
    
    // Update the assistant with the subscription information
    const { error: updateError } = await supabase
      .from('assistants')
      .update({
        params: {
          ...existingParams,
          subscription: {
            ...existingSubscription,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            status: subscription.status,
            createdAt: new Date().toISOString()
          }
        }
      })
      .eq('id', assistantId);
      
    if (updateError) {
      console.error('Error updating assistant:', updateError);
      return NextResponse.json({ error: 'Failed to update assistant with subscription data' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status
      }
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create subscription',
      details: error.message 
    }, { status: 500 });
  }
}