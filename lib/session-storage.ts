import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface AssistantData {
  name: string;
  description?: string;
  concierge_name?: string;
  personality?: string;
  business_name?: string;
  business_phone?: string;
  share_phone_number?: boolean;
  display_name?: string;
}

export interface SessionData {
  assistantData: AssistantData;
  customerId: string;
  userId: string;
  authUserId: string;
  createdAt: string;
  expiresAt: string;
}

// Create a special session to store assistant data and redirect to pricing table
export async function createStripeSessionWithData(
  customerId: string,
  data: SessionData,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; session: Stripe.Checkout.Session }> {
  // Flatten the assistant data for metadata (Stripe has a 500 char limit per metadata value)
  const metadata: Record<string, string> = {
    // User and session info
    userId: data.userId,
    authUserId: data.authUserId,
    customerId: data.customerId,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,

    // Assistant data
    assistant_name: data.assistantData.name,
    assistant_description: data.assistantData.description || '',
    concierge_name: data.assistantData.concierge_name || '',
    personality: data.assistantData.personality || '',
    business_name: data.assistantData.business_name || '',
    business_phone: data.assistantData.business_phone || '',
    share_phone_number: data.assistantData.share_phone_number ? 'true' : 'false',
    display_name: data.assistantData.display_name || '',

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
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata) {
      return null;
    }

    const metadata = session.metadata;

    // Reconstruct the session data from metadata
    const sessionData: SessionData = {
      userId: metadata.userId,
      authUserId: metadata.authUserId,
      customerId:
        typeof session.customer === 'string' ? session.customer : session.customer?.id || '',
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
      assistantData: {
        name: metadata.assistant_name,
        description: metadata.assistant_description || undefined,
        concierge_name: metadata.concierge_name || undefined,
        personality: metadata.personality || undefined,
        business_name: metadata.business_name || undefined,
        business_phone: metadata.business_phone || undefined,
        share_phone_number: metadata.share_phone_number === 'true',
        display_name: metadata.display_name || undefined,
      },
    };

    return sessionData;
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return null;
  }
}
