import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { getSubscriptionPlanDetails } from '@/lib/subscription-plans';
import type { CreateAssistantRequest } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/server-admin';

// Import specific insert types
type AssistantActivityInsert = Database['public']['Tables']['assistant_activity']['Insert'];
type AssistantUsageLimitsInsert = Database['public']['Tables']['assistant_usage_limits']['Insert'];

function generatePineconeName(base: string): string {
  let prefix = base.toLowerCase().replaceAll(/[^a-z0-9]/g, '-');

  prefix = prefix.slice(0, 40);
  const timestamp = Date.now().toString().slice(-6); // Use timestamp for uniqueness

  return `${prefix}-${timestamp}`;
}

export const POST = requireAuth(async (context, req: NextRequest) => {
  try {
    const body = (await req.json()) as CreateAssistantRequest;

    const {
      name,
      description,
      concierge_name,
      business_name,
      business_phone,
      plan = 'personal', // Default plan
      stripeCheckoutSessionId, // Added for payment verification
      paymentSessionId, // Added for linking to payment session
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }

    let verifiedPlanId = plan;
    let subscriptionStatus: Database['public']['Tables']['assistant_subscriptions']['Insert']['status'] =
      'trialing'; // Default status for new subscriptions

    // If a plan other than personal is selected, verify payment
    if (plan !== 'personal' && stripeCheckoutSessionId) {
      try {
        // Payment verification would be implemented here
        // For now, proceeding with plan creation
        verifiedPlanId = plan; // Assume plan from request is the one paid for after verification
        subscriptionStatus = 'active'; // Set status to active if payment is "verified"
      } catch (verificationError: unknown) {
        return NextResponse.json(
          {
            error: 'Failed to verify payment',
            details:
              verificationError instanceof Error
                ? verificationError.message
                : String(verificationError),
          },
          { status: 500 }
        );
      }
    } else if (plan !== 'personal' && !stripeCheckoutSessionId) {
      // If it's a paid plan, stripeCheckoutSessionId is required
      return NextResponse.json(
        { error: 'Stripe Checkout Session ID is required for paid plans.' },
        { status: 400 }
      );
    }

    // Check if this is a webhook call (has paymentSessionId and stripeCheckoutSessionId)
    const isWebhookCall = Boolean(paymentSessionId && stripeCheckoutSessionId);
    let userId: string;
    let dbClient: SupabaseClient<Database>;

    if (isWebhookCall) {
      // For webhook calls, use admin client and get user from payment session
      dbClient = await createAdminClient();

      if (!paymentSessionId) {
        return NextResponse.json(
          { error: 'Payment session ID is required for webhook calls' },
          { status: 400 }
        );
      }

      const { data: paymentSessionData, error: paymentSessionError } = await dbClient
        .from('payment_sessions')
        .select('*')
        .eq('id', paymentSessionId)
        .single();

      if (paymentSessionError || !paymentSessionData || !paymentSessionData.user_id) {
        return NextResponse.json(
          { error: 'Valid payment session with user_id not found' },
          { status: 404 }
        );
      }

      userId = paymentSessionData.user_id; // This is the correct application user ID (public.users.id)

      // The previous lookup for userData using auth_user_id is removed as it was incorrect.
      // We now directly use the user_id from payment_sessions.
    } else {
      // For regular calls, use the authenticated user from context
      // Create supabase client for database operations
      dbClient = await createClient();
      userId = context.user.id;
    }

    // Validate verifiedPlanId using local configuration
    const planDetails = getSubscriptionPlanDetails(verifiedPlanId);

    if (!planDetails) {
      return NextResponse.json(
        { error: `Invalid plan specified: ${verifiedPlanId}. Plan not found in configuration.` },
        { status: 400 }
      );
    }

    // Use the ID from the local configuration (e.g., "personal", "business")
    const actualPlanIdForDb = planDetails.id;

    // The database query for plan UUID is removed as we now use the local config.

    // Ensure planDetails is not null (already checked before, but good for safety here)
    if (!planDetails) {
      // This case should ideally be caught earlier, but as a safeguard:
      return NextResponse.json(
        { error: 'Internal server error: Plan details missing.' },
        { status: 500 }
      );
    }

    const pendingAssistantId = uuidv4(); // Define pendingAssistantId outside the try block for wider scope in catch

    try {
      const pinecone_name = generatePineconeName(name);

      const pendingAssistantData: Database['public']['Tables']['assistants']['Insert'] = {
        id: pendingAssistantId,
        user_id: userId,
        name,
        created_at: new Date().toISOString(),
        pending: true,
      };

      const { error: insertError } = await dbClient
        .from('assistants')
        .insert([pendingAssistantData]);

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to save pending assistant to database' },
          { status: 500 }
        );
      }

      // Insert consolidated config data into assistant_configs table
      const configData: Database['public']['Tables']['assistant_configs']['Insert'] = {
        id: pendingAssistantId,
        description: description ?? null,
        display_name: concierge_name ?? name,
        business_name: business_name ?? null,
        business_phone: business_phone ?? null,
        pinecone_name,
      };
      const { error: configInsertError } = await dbClient
        .from('assistant_configs')
        .insert([configData]);

      if (configInsertError) {
        // Attempt to delete the pending assistant if config insertion fails
        await dbClient.from('assistants').delete().eq('id', pendingAssistantId);

        return NextResponse.json(
          { error: 'Failed to save assistant configuration' },
          { status: 500 }
        );
      }

      // Insert subscription data using the fetched actualPlanUUID
      const subscriptionData: Database['public']['Tables']['assistant_subscriptions']['Insert'] = {
        id: uuidv4(),
        assistant_id: pendingAssistantId,
        status: subscriptionStatus,
        plan_id: actualPlanIdForDb, // Use the ID from lib/subscription-plans.ts
        payment_session_id: paymentSessionId || null,
        stripe_subscription_id: null, // Will be updated by webhook when payment is processed
        created_at: new Date().toISOString(),
      };

      const { error: subscriptionInsertError } = await dbClient
        .from('assistant_subscriptions')
        .insert([subscriptionData]);

      if (subscriptionInsertError) {
        // Attempt to clean up assistant and config if subscription fails
        await dbClient.from('assistant_configs').delete().eq('id', pendingAssistantId);
        await dbClient.from('assistants').delete().eq('id', pendingAssistantId);

        return NextResponse.json({ error: 'Failed to save subscription data.' }, { status: 500 });
      }

      // Insert into assistant_activity
      const nowISO = new Date().toISOString();
      const activityData: AssistantActivityInsert = {
        assistant_id: pendingAssistantId,
        total_documents: 0,
        total_interactions: 0,
        total_messages: 0,
        total_tokens: 0,
        total_webpages: 0,
        last_activity_at: nowISO,
        last_message_at: null,
        last_used_at: null,
        created_at: nowISO,
        updated_at: nowISO,
      };

      const { error: activityInsertError } = await dbClient
        .from('assistant_activity')
        .insert([activityData]);

      if (activityInsertError) {
        // Rollback previous inserts
        await dbClient
          .from('assistant_subscriptions')
          .delete()
          .eq('assistant_id', pendingAssistantId);
        await dbClient.from('assistant_configs').delete().eq('id', pendingAssistantId);
        await dbClient.from('assistants').delete().eq('id', pendingAssistantId);

        return NextResponse.json(
          { error: 'Failed to save assistant activity data.' },
          { status: 500 }
        );
      }

      // Insert into assistant_usage_limits
      const limitsData: AssistantUsageLimitsInsert = {
        assistant_id: pendingAssistantId,
        document_limit: planDetails.limits.maxDocuments,
        message_limit: planDetails.limits.maxMessages,
        token_limit: planDetails.limits.maxTokens,
        webpage_limit: planDetails.limits.maxWebpages,
        created_at: nowISO,
        updated_at: nowISO,
      };

      const { error: limitsInsertError } = await dbClient
        .from('assistant_usage_limits')
        .insert([limitsData]);

      if (limitsInsertError) {
        // Rollback previous inserts
        await dbClient.from('assistant_activity').delete().eq('assistant_id', pendingAssistantId);
        await dbClient
          .from('assistant_subscriptions')
          .delete()
          .eq('assistant_id', pendingAssistantId);
        await dbClient.from('assistant_configs').delete().eq('id', pendingAssistantId);
        await dbClient.from('assistants').delete().eq('id', pendingAssistantId);

        return NextResponse.json(
          { error: 'Failed to save assistant usage limits.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Assistant ${name} created successfully with activity and limits initialized`,
        assistantId: pendingAssistantId,
        pendingAssistantId,
      });
    } catch (apiError: unknown) {
      const UNKNOWN_ERROR = 'Unknown error';
      // General rollback for any error during the assistant creation process
      // Ensure pendingAssistantId is valid before attempting cleanup

      if (pendingAssistantId) {
        try {
          await dbClient.from('assistant_activity').delete().eq('assistant_id', pendingAssistantId);
          await dbClient
            .from('assistant_usage_limits')
            .delete()
            .eq('assistant_id', pendingAssistantId);
          await dbClient
            .from('assistant_subscriptions')
            .delete()
            .eq('assistant_id', pendingAssistantId);
          await dbClient.from('assistant_configs').delete().eq('id', pendingAssistantId);
          await dbClient.from('assistants').delete().eq('id', pendingAssistantId);
        } catch {
          // Cleanup failed, but we don't want to throw another error
        }
      }

      return NextResponse.json(
        {
          error: 'Failed to create assistant',
          details: apiError instanceof Error ? apiError.message : UNKNOWN_ERROR,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    // This is the outermost catch block. Errors here are likely before pendingAssistantId is defined
    // or are issues with the request/response objects themselves.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});
