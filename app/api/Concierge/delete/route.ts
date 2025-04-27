import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';

// Helper function for checking subscription params
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
    
    const { assistantName } = body;
    
    // Validate required fields
    if (!assistantName) {
      return NextResponse.json({ error: 'No-show name is required' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Fetch the assistant to check for subscription
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select('*')
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName)
        .single();

      if (assistantError) {
        console.error('Error fetching assistant:', assistantError);
      } else if (assistantData) {
        // Check if there is a subscription to cancel
        let subscriptionId: string | undefined;
        if (hasSubscription(assistantData.params)) {
          subscriptionId = assistantData.params.subscription.stripeSubscriptionId;
        }
        
        // If there's an active subscription, cancel it without a refund
        if (subscriptionId && stripe) {
          try {
            console.log(`Canceling subscription ${subscriptionId} for No-Show ${assistantName}`);
            
            // Cancel subscription with no refund (prorate: false means no partial refunds)
            await stripe.subscriptions.cancel(subscriptionId, {
              prorate: false,
            });
            
            console.log(`Successfully canceled subscription ${subscriptionId} for No-Show ${assistantName}`);
          } catch (stripeError) {
            console.error('Error canceling Stripe subscription:', stripeError);
            // Continue with deletion even if subscription cancellation fails
          }
        }
      }
      
      // Delete from Pinecone
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      await pinecone.deleteAssistant(assistantName);
      
      // Delete from Supabase (adding record cleanup)
      const { error: deleteError } = await supabase
        .from('assistants')
        .delete()
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName);
        
      if (deleteError) {
        console.error('Error deleting No-Show from database:', deleteError);
        // We continue since the assistant was deleted from Pinecone already
      }

      // Clean up chat history
      const { error: chatDeleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName);
        
      if (chatDeleteError) {
        console.error('Error cleaning up chat history:', chatDeleteError);
      }

      return NextResponse.json({ message: `No-Show ${assistantName} deleted` });
    } catch (apiError) {
      console.error('Error deleting No-Show:', apiError);
      return NextResponse.json(
        { error: 'Failed to delete No-Show' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}