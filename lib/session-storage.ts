import Stripe from 'stripe';

import type { SessionData } from '@/types/admin.types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

export async function createStripeSessionWithData(
  customerId: string,
  data: SessionData,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; session: Stripe.Checkout.Session }> {
  const metadata: Record<string, string> = {
    // User and session info
    userId: data.userId,
    authUserId: data.authUserId,
    customerId: data.customerId,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    assistant_name: data.assistantData.name,
    assistant_description: data.assistantData.description ? data.assistantData.description : '',
    concierge_name: data.assistantData.concierge_name ? data.assistantData.concierge_name : '',
    personality: data.assistantData.personality ? data.assistantData.personality : '',
    business_name: data.assistantData.business_name ? data.assistantData.business_name : '',
    business_phone: data.assistantData.business_phone ? data.assistantData.business_phone : '',
    share_phone_number: data.assistantData.share_phone_number ? 'true' : 'false',
    display_name: data.assistantData.display_name ? data.assistantData.display_name : '',
    // Mark this as a pricing table session
    pricing_table_session: 'true',
  };

  // Create a setup session instead of a subscription session
  // This allows us to store metadata without requiring line items
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'setup',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: `user-${data.userId}`,
    metadata,
    payment_method_types: ['card'],
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    session,
  };
}

// Get session data from Stripe session metadata
export async function getSessionData(sessionId: string): Promise<SessionData | null> {
  try {
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata: Stripe.Metadata = session.metadata || {};

    // Reconstruct the session data from metadata
    const sessionData: SessionData = {
      userId: metadata.userId,
      authUserId: metadata.authUserId,
      customerId: metadata.customerId,
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
      assistantData: {
        name: metadata.assistant_name,
        description: metadata.assistant_description,
        concierge_name: metadata.concierge_name,
        personality: metadata.personality,
        business_name: metadata.business_name,
        business_phone: metadata.business_phone,
        share_phone_number: metadata.share_phone_number === 'true',
        display_name: metadata.display_name,
      },
    };

    return sessionData;
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return null;
  }
}
