import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getPineconeClient } from '@/lib/pinecone';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { data: assistant, error: assistantFetchError } = await supabase
        .schema('assistants')
        .from('assistants')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', assistantName)
        .single();

      if (assistantFetchError) {
        console.error('Error fetching assistant:', assistantFetchError);
      }

      if (assistant?.id) {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .schema('assistants')
          .from('assistant_subscriptions')
          .select('stripe_subscription_id')
          .eq('assistant_id', assistant.id)
          .single();

        if (subscriptionError) {
          console.error('Error fetching assistant subscription:', subscriptionError);
        } else if (subscriptionData.stripe_subscription_id) {
          const stripeSubscriptionId = subscriptionData.stripe_subscription_id;
          if (stripe && stripeSubscriptionId) {
            try {
              console.log(
                `Canceling subscription ${stripeSubscriptionId} for Assistant ${assistantName}`
              );
              await stripe.subscriptions.cancel(stripeSubscriptionId, {
                prorate: false,
              });
              console.log(
                `Successfully canceled subscription ${stripeSubscriptionId} for Assistant ${assistantName}`
              );
            } catch (stripeError: unknown) {
              console.error('Error canceling Stripe subscription:', stripeError);
            }
          }
        }
      } else if (!assistant) {
        console.log(
          `Assistant ${assistantName} not found in DB, cannot check for Stripe subscription.`
        );
      }

      const pinecone = getPineconeClient();
      try {
        await pinecone.deleteAssistant(assistantName);
        console.log(`Assistant ${assistantName} deleted from Pinecone.`);
      } catch (pineconeError: unknown) {
        console.error(`Error deleting assistant ${assistantName} from Pinecone:`, pineconeError);
      }

      const { error: deleteError } = await supabase
        .schema('assistants')
        .from('assistants')
        .delete()
        .eq('user_id', user.id)
        .eq('name', assistantName);

      if (deleteError) {
        console.error('Error deleting assistant from Supabase assistants table:', deleteError);
      } else {
        console.log(
          `Assistant ${assistantName} (user: ${user.id}) deletion attempted from Supabase 'assistants' table.`
        );
      }

      return NextResponse.json({ message: `Assistant ${assistantName} processed for deletion.` });
    } catch (apiError: unknown) {
      console.error('API error during assistant deletion:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      return NextResponse.json(
        { error: 'Failed to delete assistant', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/Concierge/delete:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
