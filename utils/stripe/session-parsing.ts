import type Stripe from 'stripe';

/**
 * Parses client reference ID to extract user ID and session ID
 */
export function parseClientReferenceId(clientReferenceId: string) {
  // Try new format first: user-{userId}-session-{sessionId}
  const newFormatMatch = clientReferenceId.match(
    /^user-([a-f0-9A-F-]+)-session-([a-f0-9A-F-]+)$/
  );
  
  if (newFormatMatch) {
    return {
      userId: newFormatMatch[1],
      sessionId: newFormatMatch[2],
      format: 'new' as const,
    };
  }

  // Fall back to old format: user-{userId}
  const oldFormatMatch = clientReferenceId.match(/^user-([a-f0-9A-F-]+)$/);
  if (oldFormatMatch) {
    return {
      userId: oldFormatMatch[1],
      sessionId: null,
      format: 'old' as const,
    };
  }

  throw new Error(`Invalid client_reference_id format: ${clientReferenceId}`);
}

/**
 * Extracts user ID from session metadata or client reference ID
 */
export function extractUserIdFromSession(session: Stripe.Checkout.Session) {
  const userIdFromMetadata = session.metadata?.user_id;
  
  if (userIdFromMetadata) {
    return { userId: userIdFromMetadata, sessionId: null };
  }

  if (session.client_reference_id) {
    try {
      const parsed = parseClientReferenceId(session.client_reference_id);
      return { userId: parsed.userId, sessionId: parsed.sessionId };
    } catch (error) {
      console.warn('Failed to parse client_reference_id:', error);
    }
  }

  return { userId: null, sessionId: null };
}
