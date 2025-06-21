import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db.types';

type PaymentSession = Database['public']['Tables']['payment_sessions']['Row'];
type PaymentSessionUpdate = Database['public']['Tables']['payment_sessions']['Update'];

/**
 * Fetches payment session by internal session ID or stripe checkout session ID
 */
export async function fetchPaymentSession(
  supabase: SupabaseClient<Database>,
  internalPaymentSessionId: string | null,
  stripeCheckoutSessionId: string
): Promise<PaymentSession> {
  let paymentSession: PaymentSession | null = null;
  let error: unknown = null;

  if (internalPaymentSessionId) {
    console.log('[PAYMENT SESSION] Fetching by internal session_id:', internalPaymentSessionId);
    const { data: paymentSessionData, error: paymentError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', internalPaymentSessionId)
      .single();

    paymentSession = paymentSessionData;
    error = paymentError;
  } else {
    console.warn(
      '[PAYMENT SESSION] Falling back to stripe_checkout_session_id:',
      stripeCheckoutSessionId
    );
    const { data: paymentSessionFallback, error: errorFallback } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
      .single();

    paymentSession = paymentSessionFallback;
    error = errorFallback;
  }

  if (error || !paymentSession) {
    throw new Error(
      `Payment session not found. Internal ID: ${internalPaymentSessionId}, Stripe ID: ${stripeCheckoutSessionId}`
    );
  }

  return paymentSession;
}

/**
 * Updates payment session with completion status
 */
export async function updatePaymentSession(
  supabase: SupabaseClient<Database>,
  paymentSession: PaymentSession,
  stripeCheckoutSessionId: string,
  resolvedUserId: string
): Promise<void> {
  const updatePayload: PaymentSessionUpdate = {
    updated_at: new Date().toISOString(),
    status: 'completed',
  };

  // Update stripe checkout session ID if different
  if (paymentSession.stripe_checkout_session_id !== stripeCheckoutSessionId) {
    console.log('[PAYMENT SESSION] Updating stripe_checkout_session_id:', stripeCheckoutSessionId);
    updatePayload.stripe_checkout_session_id = stripeCheckoutSessionId;
  }

  // Update user ID if needed
  if (paymentSession.user_id !== resolvedUserId) {
    if (paymentSession.user_id === null && resolvedUserId) {
      console.log('[PAYMENT SESSION] Setting user_id:', resolvedUserId);
      updatePayload.user_id = resolvedUserId;
    } else if (paymentSession.user_id !== null && paymentSession.user_id !== resolvedUserId) {
      console.warn(
        `[PAYMENT SESSION] User ID mismatch. Current: ${paymentSession.user_id}, Resolved: ${resolvedUserId}`
      );
      updatePayload.user_id = resolvedUserId;
    }
  }

  const { error } = await supabase
    .from('payment_sessions')
    .update(updatePayload)
    .eq('id', paymentSession.id);

  if (error) {
    throw new Error(`Failed to update payment session: ${error.message}`);
  }

  console.log(`[PAYMENT SESSION] Updated payment session ${paymentSession.id}`);
}
