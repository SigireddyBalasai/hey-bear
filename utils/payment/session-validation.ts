import type Stripe from "stripe";

/**
 * Validates that a Stripe checkout session is complete and paid
 */
export function validatePaymentSession(session: Stripe.Checkout.Session) {
  const errors: string[] = [];

  if (session.payment_status !== "paid") {
    errors.push(`Payment not completed. Status: ${session.payment_status}`);
  }

  if (session.status !== "complete") {
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
  // Use a safer regex pattern by breaking it down
  const userPattern =
    /^user-([a-f0-9A-F]{8}-[a-f0-9A-F]{4}-[a-f0-9A-F]{4}-[a-f0-9A-F]{4}-[a-f0-9A-F]{12})/;
  const sessionPattern =
    /-session-([a-f0-9A-F]{8}-[a-f0-9A-F]{4}-[a-f0-9A-F]{4}-[a-f0-9A-F]{4}-[a-f0-9A-F]{12})$/;

  const userMatch = clientRefId.match(userPattern);

  if (!userMatch) {
    throw new Error(`Invalid client_reference_id format: ${clientRefId}`);
  }

  const [, authUserId] = userMatch;

  const sessionMatch = clientRefId.match(sessionPattern);
  const internalPaymentSessionId = sessionMatch?.[1] ?? null;

  return {
    authUserId,
    internalPaymentSessionId,
  };
}

/**
 * Validates webhook payload structure
 */
export function validateWebhookPayload(
  body: unknown,
): body is { data: { object: Stripe.Checkout.Session } } {
  const typedBody = body as { data?: { object?: { object?: string } } };

  return Boolean(
    typedBody?.data?.object &&
      typedBody.data.object.object === "checkout.session",
  );
}
