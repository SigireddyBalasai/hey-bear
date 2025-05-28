import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { assistantName } = body;
    
    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Fetch the assistant by name to get its ID
      const { data: assistant, error: assistantFetchError } = await supabase
        .schema('assistants')
        .from('assistants')
        .select('id') 
        .eq('user_id', user.id)
        .eq('name', assistantName) // Query by name
        .single();

      if (assistantFetchError && !assistant) {
        console.error('Error fetching assistant:', assistantFetchError);
        // Assistant not found or error fetching, proceed to Pinecone deletion as per original flow.
      }
      
      // Attempt to cancel Stripe subscription if assistant was found
      if (assistant && assistant.id) {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .schema('assistants')
          .from('assistant_subscriptions') // Corrected table name to plural
          .select('stripe_subscription_id')
          .eq('assistant_id', assistant.id) 
          .single();

        if (subscriptionError) {
          console.error('Error fetching assistant subscription:', subscriptionError);
        } else if (subscriptionData && subscriptionData.stripe_subscription_id) {
          const stripeSubscriptionId = subscriptionData.stripe_subscription_id;
          if (stripe && stripeSubscriptionId) {
            try {
              console.log(`Canceling subscription ${stripeSubscriptionId} for Assistant ${assistantName}`);
              await stripe.subscriptions.cancel(stripeSubscriptionId, {
                prorate: false,
              });
              console.log(`Successfully canceled subscription ${stripeSubscriptionId} for Assistant ${assistantName}`);
            } catch (stripeError: unknown) { // Typed stripeError as unknown
              console.error('Error canceling Stripe subscription:', stripeError);
            }
          }
        }
      } else if (!assistant) {
        console.log(`Assistant ${assistantName} not found in DB, cannot check for Stripe subscription.`);
      }
      
      // Delete from Pinecone
      const pinecone = getPineconeClient();
      if (pinecone) {
        try {
            await pinecone.deleteAssistant(assistantName); 
            console.log(`Assistant ${assistantName} deleted from Pinecone.`);
        } catch (pineconeError: unknown) { // Typed pineconeError as unknown
            console.error(`Error deleting assistant ${assistantName} from Pinecone:`, pineconeError);
        }
      } else {
        console.error('Pinecone client initialization failed, skipping Pinecone deletion.');
      }
      
      // Delete from Supabase (main assistants table)
      const { error: deleteError } = await supabase
        .schema('assistants')
        .from('assistants')
        .delete()
        .eq('user_id', user.id) 
        .eq('name', assistantName); 
        
      if (deleteError) {
        console.error('Error deleting assistant from Supabase assistants table:', deleteError);
      } else {
        console.log(`Assistant ${assistantName} (user: ${user.id}) deletion attempted from Supabase 'assistants' table.`);
      }

      // TODO: Implement cascading deletes or manual cleanup for related tables:
      // assistant_config, assistant_subscription, assistant_usage_limits, documents, etc.

      return NextResponse.json({ message: `Assistant ${assistantName} processed for deletion.` });
    } catch (apiError: unknown) { // Typed apiError as unknown
      console.error('API error during assistant deletion:', apiError);
      // It's good practice to check the type of apiError before accessing .message
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      return NextResponse.json(
        { error: 'Failed to delete assistant', details: errorMessage }, 
        { status: 500 }
      );
    }
  } catch (e: unknown) { // Typed e as unknown
    console.error('Unexpected error in POST /api/Concierge/delete:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}