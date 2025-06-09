import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getPineconeClient } from '@/lib/pinecone';
import { getStripeInstance } from '@/lib/stripe';
// Ensure SupabaseClient is imported

import type { Database } from '@/types/db.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

interface DeleteAssistantRequest {
  assistantName: string;
}

// Helper function to cancel Stripe subscription
async function cancelStripeSubscription(
  supabase: SupabaseClient<Database>,
  assistantId: string,
  assistantName: string // For logging purposes
): Promise<void> {
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('assistant_subscriptions')
    .select('stripe_subscription_id')
    .eq('assistant_id', assistantId)
    .single();

  if (subscriptionError) {
    // It's okay if no subscription is found, might be a free plan or already cancelled
    if (subscriptionError.code === 'PGRST116') {
      // PostgREST error for "No rows found"
      console.log(
        `No Stripe subscription found for assistant ID ${assistantId} (${assistantName}). Skipping cancellation.`
      );
      return;
    }
    console.error(
      `Error fetching Stripe subscription for assistant ID ${assistantId} (${assistantName}):`,
      subscriptionError
    );
    // Do not throw, attempt to continue other cleanup operations
    return;
  }

  if (!subscriptionData?.stripe_subscription_id) {
    console.log(
      `No Stripe subscription ID found for assistant ID ${assistantId} (${assistantName}). Skipping cancellation.`
    );
    return;
  }

  const stripeSubscriptionId = subscriptionData.stripe_subscription_id;
  const stripe = await getStripeInstance();
  if (stripe && stripeSubscriptionId) {
    try {
      console.log(
        `Attempting to cancel Stripe subscription ${stripeSubscriptionId} for assistant ${assistantName} (ID: ${assistantId})`
      );
      // Consider using delete_at_period_end: true for a less immediate cancellation
      await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
      // Or to cancel immediately: await stripe.subscriptions.del(stripeSubscriptionId);
      console.log(
        `Successfully requested cancellation for Stripe subscription ${stripeSubscriptionId} for assistant ${assistantName}`
      );
    } catch (stripeError: unknown) {
      console.error(
        `Error canceling Stripe subscription ${stripeSubscriptionId} for assistant ${assistantName}:`,
        stripeError
      );
      // Log error but do not re-throw, to allow other cleanup operations to proceed
    }
  }
}

// Helper function to delete assistant from Pinecone
async function deletePineconeAssistant(assistantName: string): Promise<void> {
  // Note: The subtask mentions that assistantName from the request is used.
  // If assistant_configs.pinecone_name is the actual identifier, this function would need adjustment.
  // For now, sticking to the current behavior.
  const pinecone = getPineconeClient(); // Assuming getPineconeClient is correctly set up
  try {
    console.log(`Attempting to delete assistant "${assistantName}" from Pinecone.`);
    await pinecone.deleteAssistant(assistantName);
    console.log(`Assistant "${assistantName}" successfully deleted from Pinecone.`);
  } catch (pineconeError: unknown) {
    // It's possible the assistant doesn't exist in Pinecone (e.g., if creation failed partially)
    // Log the error but don't let it block other cleanup operations.
    console.warn(
      `Error deleting assistant "${assistantName}" from Pinecone (it may not exist or another issue occurred):`,
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
  // assistant_configs, assistant_subscriptions, assistant_activity, assistant_usage_limits
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

    // Fetch assistant details (ID and assigned_phone_number) using appUserId and assistantName
    // No need to join with assistant_configs for pinecone_name if deletePineconeAssistant uses assistantName from request.
    const { data: assistantForDb, error: assistantDbFetchError } = await supabase
      .from('assistants')
      .select('id, assigned_phone_number')
      .eq('user_id', appUserId) // Use the application user ID
      .eq('name', assistantName) // assistantName from request body
      .single();

    if (assistantDbFetchError || !assistantForDb) {
      console.warn(
        `Assistant "${assistantName}" not found in DB for user ${appUserId}. Attempting Pinecone deletion as cleanup. Error:`,
        assistantDbFetchError?.message
      );
      // Try to delete from Pinecone as a cleanup attempt if it was orphaned.
      await deletePineconeAssistant(assistantName); // Uses assistantName from request
      return NextResponse.json(
        {
          message: `Assistant "${assistantName}" not found in database for your account. Pinecone deletion attempted.`,
        },
        { status: 404 }
      );
    }

    const assistantId = assistantForDb.id;
    const assignedPhoneNumber = assistantForDb.assigned_phone_number;

    // --- Orchestrate Deletion Steps ---

    // 1. Cancel Stripe Subscription (if any)
    // cancelStripeSubscription handles errors internally and logs them.
    await cancelStripeSubscription(supabase, assistantId, assistantName);

    // 2. Delete from Pinecone
    // deletePineconeAssistant handles errors internally and logs them.
    // Uses assistantName from the request as per current behavior analysis.
    await deletePineconeAssistant(assistantName);

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
    return NextResponse.json({
      message: `Assistant "${assistantName}" and its related data have been processed for deletion.`,
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
