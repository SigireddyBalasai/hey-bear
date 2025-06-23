import type Stripe from 'stripe';

import type { CreateAssistantResult } from '@/types/api.types';
import type { Database } from '@/types/db.types';

import { createDefaultAssistant } from './assistant-creation';

// Database types for assistant metadata
type AssistantRow = Database['public']['Tables']['assistants']['Row'];
type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];

type AssistantMetadata = Pick<AssistantRow, 'name'> &
  Pick<
    AssistantConfigRow,
    | 'description'
    | 'concierge_name'
    | 'personality'
    | 'business_name'
    | 'business_phone'
    | 'share_phone_number'
    | 'display_name'
  >;

/**
 * Extracts assistant data from Stripe session metadata
 */
export function extractAssistantMetadata(session: Stripe.Checkout.Session): AssistantMetadata {
  return {
    name: session.metadata?.assistant_name ?? '',
    description: session.metadata?.assistant_description ?? '',
    concierge_name: session.metadata?.concierge_name ?? '',
    personality: session.metadata?.personality ?? '',
    business_name: session.metadata?.business_name ?? '',
    business_phone: session.metadata?.business_phone ?? '',
    share_phone_number: session.metadata?.share_phone_number === 'true',
    display_name: session.metadata?.display_name ?? '',
  };
}

/**
 * Creates assistant from metadata or default if no metadata exists
 */
export async function createAssistantFromMetadata(
  session: Stripe.Checkout.Session,
  sessionId: string,
  origin: string
): Promise<CreateAssistantResult> {
  // Check if we have metadata
  if (!session.metadata || Object.keys(session.metadata).length === 0) {
    console.warn('[LEGACY FLOW] No metadata found, creating default assistant');
    const customerEmail = session.customer_details?.email ?? '';

    return createDefaultAssistant(customerEmail, sessionId, origin);
  }

  // Extract assistant data from metadata
  const assistantData = extractAssistantMetadata(session);

  console.log('[LEGACY FLOW] Assistant data extracted:', {
    name: assistantData.name,
    description: assistantData.description,
    conciergeName: assistantData.concierge_name,
    businessName: assistantData.business_name,
  });

  // Verify we have required data
  if (!assistantData.name) {
    throw new Error('Missing assistant name in session metadata');
  }

  const createAssistantPayload = {
    assistantName: assistantData.name,
    description: assistantData.description,
    params: {
      conciergeName: assistantData.concierge_name,
      businessName: assistantData.business_name,
      phoneNumber: assistantData.business_phone,
    },
    stripeCheckoutSessionId: sessionId,
    plan: 'personal',
  };

  console.log('[LEGACY FLOW] Assistant creation payload:', createAssistantPayload);

  const response = await fetch(`${origin}/api/Concierge/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createAssistantPayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Failed to read error response');

    throw new Error(`Assistant creation failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as CreateAssistantResult;
}
