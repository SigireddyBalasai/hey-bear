import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';


import { getPineconeClient } from '@/lib/pinecone';
import { getStripeInstance } from '@/lib/stripe';
import type { DeleteAssistantRequest } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Helper function to cancel Stripe subscription
async function cancelStripeSubscription(
  supabase: SupabaseClient<Database>,
  assistantId: string,
  assistantName: string // For logging purposes
): Promise<{ subscriptionsFound: number; subscriptionsCanceled: number }> {
  // Query for ALL subscriptions for this assistant (not just one)
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('assistant_subscriptions')
    .select('*')
    .eq('assistant_id', assistantId);

  if (subscriptionError) {
    console.error(
      `Error fetching Stripe subscriptions for assistant ID ${assistantId} (${assistantName}):`,
      subscriptionError
    );

    return { subscriptionsFound: 0, subscriptionsCanceled: 0 };
  }

  if (!subscriptionData || subscriptionData.length === 0) {
    console.log(
      `No subscriptions found for assistant ID ${assistantId} (${assistantName}). Skipping cancellation.`
    );

    return { subscriptionsFound: 0, subscriptionsCanceled: 0 };
  }

  console.log(
    `Found ${subscriptionData.length} subscription(s) for assistant ${assistantName} (ID: ${assistantId})`
  );

  const stripe = await getStripeInstance();
  let subscriptionsCanceled = 0;

  for (const subscription of subscriptionData) {
    console.log(
      `Processing subscription ${subscription.id} with status: ${subscription.status}, stripe_subscription_id: ${subscription.stripe_subscription_id ?? 'null'}`
    );

    // If there's no Stripe subscription ID, just mark it as canceled in our database
    if (!subscription.stripe_subscription_id) {
      console.log(
        `No Stripe subscription ID for subscription ${subscription.id}. Marking as canceled in database.`
      );

      await supabase
        .from('assistant_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      subscriptionsCanceled++;
      continue;
    }

    // If there is a Stripe subscription ID, cancel it in Stripe
    if (stripe) {
      try {
        const stripeSubscriptionId = subscription.stripe_subscription_id;

        console.log(
          `Attempting to cancel Stripe subscription ${stripeSubscriptionId} for assistant ${assistantName}`
        );

        // First check if the subscription exists and its status
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        if (stripeSubscription.status === 'canceled') {
          console.log(`Stripe subscription ${stripeSubscriptionId} is already canceled.`);
        } else {
          // Cancel immediately in Stripe
          await stripe.subscriptions.cancel(stripeSubscriptionId);
          console.log(
            `Successfully canceled Stripe subscription ${stripeSubscriptionId} for assistant ${assistantName}`
          );
        }

        // Update our database record
        await supabase
          .from('assistant_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        subscriptionsCanceled++;
      } catch (stripeError: unknown) {
        console.error(
          `Error canceling Stripe subscription ${subscription.stripe_subscription_id} for assistant ${assistantName}:`,
          stripeError
        );

        // If subscription doesn't exist in Stripe, still update our database
        if (stripeError instanceof Error && stripeError.message.includes('No such subscription')) {
          console.log(
            `Stripe subscription ${subscription.stripe_subscription_id} not found in Stripe. Updating database.`
          );
          await supabase
            .from('assistant_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          subscriptionsCanceled++;
        }
      }
    } else {
      console.error('Failed to get Stripe instance');
    }
  }

  console.log(
    `Processed ${subscriptionData.length} subscription(s) for assistant ${assistantName}. ${subscriptionsCanceled} were successfully canceled.`
  );

  return {
    subscriptionsFound: subscriptionData.length,
    subscriptionsCanceled,
  };
}

// Helper function to delete assistant from Pinecone
async function deletePineconeAssistant(pineconeName: string): Promise<void> {
  const pinecone = getPineconeClient();

  try {
    console.log(`Attempting to delete assistant "${pineconeName}" from Pinecone.`);
    await pinecone.deleteAssistant(pineconeName);
    console.log(`Assistant "${pineconeName}" successfully deleted from Pinecone.`);
  } catch (pineconeError: unknown) {
    // It's possible the assistant doesn't exist in Pinecone (e.g., if creation failed partially)
    // Log the error but don't let it block other cleanup operations.
    console.warn(
      `Error deleting assistant "${pineconeName}" from Pinecone (it may not exist or another issue occurred):`,
      pineconeError
    );
  }
}

// Modified helper function to delete assistant data from Supabase by assistant ID
async function deleteSupabaseAssistant(
  supabase: SupabaseClient<Database>,
  assistantId: string
): Promise<void> {
  // Deletion will cascade via FOREIGN KEY constraints for related tables:
  // assistant_configs, assistant_activity, assistant_usage_limits
  console.log(
    `Attempting to delete assistant ID "${assistantId}" from Supabase 'assistants' table and related data via cascade.`
  );
  const { error: deleteError } = await supabase.from('assistants').delete().eq('id', assistantId); // Use primary key for deletion

  if (deleteError) {
    console.error(
      `Error deleting assistant ID "${assistantId}" from Supabase 'assistants' table:`,
      deleteError
    );
    // Depending on policy, you might want to throw an error here if Supabase deletion is critical
    // For now, just logging, as other cleanup might have succeeded.
  } else {
    console.log(
      `Assistant ID "${assistantId}" successfully deleted from Supabase 'assistants' table (and related data via cascade).`
    );
  }
}

export const POST = requireAuth(async (context, req: NextRequest) => {
  try {
    const body = (await req.json()) as DeleteAssistantRequest;
    const { assistantName } = body;

    if (!assistantName || typeof assistantName !== 'string') {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Use auth user ID directly since we no longer have a separate users table
    const appUserId = context.user.id;

    // Fetch assistant details (ID and assigned_phone_number) and pinecone_name using appUserId and assistantName
    const { data: assistantForDb, error: assistantDbFetchError } = await supabase
      .from('assistants')
      .select(
        `
        *,
        assistant_configs!inner(pinecone_name)
      `
      )
      .eq('user_id', appUserId) // Use the application user ID
      .eq('name', assistantName) // assistantName from request body
      .single();

    if (assistantDbFetchError || !assistantForDb) {
      console.warn(
        `Assistant "${assistantName}" not found in DB for user ${appUserId}. Error:`,
        assistantDbFetchError?.message
      );

      return NextResponse.json(
        {
          message: `Assistant "${assistantName}" not found in database for your account.`,
        },
        { status: 404 }
      );
    }

    const assistantId = assistantForDb.id;
    const assignedPhoneNumber = assistantForDb.assigned_phone_number;
    const pineconeName = assistantForDb.assistant_configs?.pinecone_name;

    // --- Orchestrate Deletion Steps ---

    // 1. Cancel Stripe Subscription (if any)
    // cancelStripeSubscription handles errors internally and logs them.
    const subscriptionResult = await cancelStripeSubscription(supabase, assistantId, assistantName);

    // 2. Delete from Pinecone
    // deletePineconeAssistant handles errors internally and logs them.
    // Use the actual pinecone_name from the database, not the user-provided assistantName
    if (pineconeName) {
      await deletePineconeAssistant(pineconeName);
    } else {
      console.warn(
        `No pinecone_name found for assistant "${assistantName}" (ID: ${assistantId}). Skipping Pinecone deletion.`
      );
    }

    // 3. Unassign Phone Number (if applicable)
    if (assignedPhoneNumber) {
      console.log(
        `Attempting to unassign phone number "${assignedPhoneNumber}" for assistant ID "${assistantId}".`
      );
      const { error: phoneUpdateError } = await supabase
        .from('phone_numbers')
        .update({ is_assigned: false, assistant_id: null }) // Set assistant_id to null
        .eq('phone_number', assignedPhoneNumber)
        .eq('assistant_id', assistantId); // Ensure we only unassign if it's still linked to this assistant

      if (phoneUpdateError) {
        console.error(
          `Error updating phone number "${assignedPhoneNumber}" to unassigned for assistant ID "${assistantId}":`,
          phoneUpdateError
        );
        // Log error, but continue with assistant deletion as it's the primary goal.
      } else {
        console.log(
          `Phone number "${assignedPhoneNumber}" successfully unassigned from assistant ID "${assistantId}".`
        );
      }
    }

    // 4. Delete from Supabase (assistants table and cascaded data)
    // deleteSupabaseAssistant handles errors internally and logs them.
    await deleteSupabaseAssistant(supabase, assistantId);

    console.log(
      `All deletion steps processed for assistant "${assistantName}" (ID: ${assistantId}).`
    );

    // Provide detailed summary of what was processed
    const summary = {
      assistantName,
      assistantId,
      pineconeName,
      assignedPhoneNumber,
      timestamp: new Date().toISOString(),
      deletionSteps: {
        stripeSubscriptionsFound: subscriptionResult.subscriptionsFound,
        stripeSubscriptionsCanceled: subscriptionResult.subscriptionsCanceled,
        pineconeDeleted: Boolean(pineconeName), // Only if there was a pinecone name
        phoneNumberUnassigned: Boolean(assignedPhoneNumber), // Only if there was an assigned phone
        supabaseDataDeleted: true, // We always attempt this
      },
    };

    console.log('Deletion summary:', JSON.stringify(summary, null, 2));

    return NextResponse.json({
      message: `Assistant "${assistantName}" and its related data have been processed for deletion.`,
      summary,
    });
  } catch (error: unknown) {
    // Outer catch for unexpected errors (e.g., JSON parsing, client creation)
    console.error('Unexpected error in POST /api/Concierge/delete:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown internal server error occurred.';

    return NextResponse.json(
      {
        error: 'Internal server error during assistant deletion process.',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});
