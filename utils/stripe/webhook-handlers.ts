import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { Database } from '@/types/db.types';
import { extractUserIdFromSession } from './session-parsing';
import { getAssistantDataFromPaymentSession, createAssistantWithConfig } from './assistant-management';
import { createAssistantSubscription, updateSubscriptionForPaymentSuccess, updateSubscriptionForPaymentFailure, handleSubscriptionDeletion } from './subscription-management';

/**
 * Handles checkout session completed events
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient<Database>
) {
  console.log('Processing checkout session completed:', session.id);

  // Extract user ID and assistant data from metadata or client_reference_id
  const assistantName = session.metadata?.assistant_name;
  const { userId, sessionId } = extractUserIdFromSession(session);

  let assistantData = null;

  // If we have a sessionId, look up assistant data from payment_sessions table
  if (sessionId && userId) {
    assistantData = await getAssistantDataFromPaymentSession(supabase, sessionId, userId);
  } else if (assistantName && session.metadata) {
    // Fallback to metadata extraction
    assistantData = {
      name: assistantName,
      description: session.metadata.assistant_description || undefined,
      concierge_name: session.metadata.concierge_name || undefined,
      personality: session.metadata.personality || undefined,
      business_name: session.metadata.business_name || undefined,
      business_phone: session.metadata.business_phone || undefined,
      share_phone_number: session.metadata.share_phone_number === 'true',
      display_name: session.metadata.display_name || undefined,
    };
  }

  console.log('Extracted data:', {
    clientReferenceId: session.client_reference_id,
    assistantName,
    userId,
    assistantData,
    customerId: session.customer,
    subscriptionId: session.subscription,
  });

  // Handle assistant creation and subscription
  if (
    session.customer &&
    session.subscription &&
    userId &&
    (assistantName || assistantData?.name)
  ) {
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

    try {
      let assistantId = null;

      if (assistantData) {
        assistantId = await createAssistantWithConfig(supabase, userId, assistantData);
      }

      if (assistantId) {
        // Create subscription record
        const success = await createAssistantSubscription(supabase, assistantId, subscriptionId, customerId);
        if (success) {
          console.log('Successfully processed checkout session completed');
        }
      }
    } catch (error) {
      console.error('Error processing checkout session completed:', error);
    }
  } else {
    console.log('Skipping assistant creation - missing required data');
  }
}

/**
 * Handles invoice payment succeeded events
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient<Database>
) {
  console.log('Processing invoice payment succeeded:', invoice.id);

  if (!invoice.subscription) {
    console.log('Invoice has no subscription, skipping');
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;

  await updateSubscriptionForPaymentSuccess(supabase, subscriptionId);
}

/**
 * Handles invoice payment failed events
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient<Database>
) {
  console.log('Processing invoice payment failed:', invoice.id);

  if (!invoice.subscription) {
    console.log('Invoice has no subscription, skipping');
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;

  await updateSubscriptionForPaymentFailure(supabase, subscriptionId);
}

/**
 * Handles subscription deleted events
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient<Database>
) {
  console.log('Processing subscription deleted:', subscription.id);
  await handleSubscriptionDeletion(supabase, subscription.id);
}
