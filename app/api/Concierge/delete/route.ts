import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/db.types';
import { getPineconeClient } from '@/lib/pinecone';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

interface DeleteAssistantRequest {
  assistantName: string;
}

async function cancelStripeSubscription(
  supabase: SupabaseClient<Database>,
  assistantId: string,
  assistantName: string
): Promise<void> {
  const { data: subscriptionData, error: subscriptionError } = await supabase

    .from('assistant_subscriptions')
    .select('stripe_subscription_id')
    .eq('assistant_id', assistantId)
    .single();

  if (subscriptionError) {
    console.error('Error fetching assistant subscription:', subscriptionError);
    return;
  }

  if (!subscriptionData?.stripe_subscription_id) {
    return;
  }

  const stripeSubscriptionId = subscriptionData.stripe_subscription_id;
  if (stripe && stripeSubscriptionId) {
    try {
      console.log(`Canceling subscription ${stripeSubscriptionId} for Assistant ${assistantName}`);
      await stripe.subscriptions.cancel(stripeSubscriptionId, { prorate: false });
      console.log(
        `Successfully canceled subscription ${stripeSubscriptionId} for Assistant ${assistantName}`
      );
    } catch (stripeError: unknown) {
      console.error('Error canceling Stripe subscription:', stripeError);
    }
  }
}

async function deletePineconeAssistant(assistantName: string): Promise<void> {
  const pinecone = getPineconeClient();
  try {
    await pinecone.deleteAssistant(assistantName);
    console.log(`Assistant ${assistantName} deleted from Pinecone.`);
  } catch (pineconeError: unknown) {
    console.error(`Error deleting assistant ${assistantName} from Pinecone:`, pineconeError);
  }
}

async function deleteSupabaseAssistant(
  supabase: SupabaseClient<Database>,
  userId: string,
  assistantName: string
): Promise<void> {
  const { error: deleteError } = await supabase

    .from('assistants')
    .delete()
    .eq('user_id', userId)
    .eq('name', assistantName);

  if (deleteError) {
    console.error('Error deleting assistant from Supabase assistants table:', deleteError);
  } else {
    console.log(
      `Assistant ${assistantName} (user: ${userId}) deletion attempted from Supabase 'assistants' table.`
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DeleteAssistantRequest;

    const { assistantName } = body;

    if (!assistantName || typeof assistantName !== 'string') {
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

        .from('assistants')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', assistantName)
        .single();

      if (assistantFetchError) {
        console.error('Error fetching assistant:', assistantFetchError);
      }

      if (assistant?.id) {
        await cancelStripeSubscription(supabase, assistant.id, assistantName);
      } else if (!assistant) {
        console.log(
          `Assistant ${assistantName} not found in DB, cannot check for Stripe subscription.`
        );
      }

      await deletePineconeAssistant(assistantName);
      await deleteSupabaseAssistant(supabase, user.id, assistantName);

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
