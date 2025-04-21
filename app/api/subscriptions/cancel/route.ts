import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';

// Helper function for type checking params.subscription
const hasSubscription = (params: any): params is { subscription: { stripeSubscriptionId?: string } } => {
  return typeof params === 'object' && 
         params !== null && 
         'subscription' in params && 
         typeof params.subscription === 'object' &&
         params.subscription !== null;
};

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { assistantId } = body;
    
    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing required field: assistantId' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the assistant to make sure it belongs to this user and get subscription info
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }
    
    // Check if there is a subscription to cancel
    let subscriptionId: string | undefined;
    if (hasSubscription(assistantData.params)) {
      subscriptionId = assistantData.params.subscription.stripeSubscriptionId;
    }
    
    if (!subscriptionId) {
      return NextResponse.json({ 
        success: true,
        message: 'No active subscription found for this assistant' 
      });
    }
    
    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscriptionId, {
      prorate: true,
    });
    
    // Update the assistant record to reflect the cancellation
    const { error: updateAssistantError } = await supabase
      .from('assistants')
      .update({
        params: hasSubscription(assistantData.params) ? {
          ...assistantData.params,
          subscription: {
            ...assistantData.params.subscription,
            status: 'canceled',
            canceledAt: new Date().toISOString()
          }
        } : assistantData.params
      })
      .eq('id', assistantId);
    
    if (updateAssistantError) {
      console.error('Error updating assistant record:', updateAssistantError);
      return NextResponse.json({ error: 'Failed to update assistant record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription canceled successfully'
    });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    }, { status: 500 });
  }
}