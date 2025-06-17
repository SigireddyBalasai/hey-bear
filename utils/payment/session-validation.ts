import type Stripe from 'stripe';

/**
 * Validates that a Stripe checkout session is complete and paid
 */
export function validatePaymentSession(session: Stripe.Checkout.Session) {
  const errors: string[] = [];

  if (session.payment_status !== 'paid') {
    errors.push(`Payment not completed. Status: ${session.payment_status}`);
  }

  if (session.status !== 'complete') {
    errors.push(`Session not complete. Status: ${session.status}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parses client reference ID to extract user ID and payment session ID
 */
export function parseClientReferenceId(clientRefId: string) {
  const match = clientRefId.match(/^user-([a-f0-9A-F-]+)(?:-session-([a-f0-9A-F-]+))?$/);
  
  if (!match) {
    throw new Error(`Invalid client_reference_id format: ${clientRefId}`);
  }

  return {
    authUserId: match[1],
    internalPaymentSessionId: match[2] || null,
  };
}

/**
 * Validates webhook payload structure
 */
export function validateWebhookPayload(body: any): body is { data: { object: Stripe.Checkout.Session } } {
  return (
    body?.data?.object &&
    body.data.object.object === 'checkout.session'
  );
}
