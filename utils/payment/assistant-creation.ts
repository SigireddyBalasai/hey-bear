import { getSubscriptionPlanDetails } from '@/lib/subscription-plans';
import type { AssistantConfigData, CreateAssistantResult } from '@/types/api.types';

/**
 * Creates an assistant using the assistant configuration data
 */
export async function createAssistantFromConfig(
  assistantConfigData: AssistantConfigData,
  sessionId: string,
  paymentSessionId: number,
  planId: string,
  origin: string
): Promise<CreateAssistantResult> {
  const planDetails = getSubscriptionPlanDetails(planId);
  if (!planDetails) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const planName = planDetails.id;
  console.log(`[ASSISTANT CREATION] Using plan: ${planName} for internal plan ID: ${planId}`);

  const createAssistantPayload = {
    assistantName:
      assistantConfigData.display_name ||
      (assistantConfigData.business_name
        ? assistantConfigData.business_name + ' Assistant'
        : 'Business Assistant'),
    description:
      assistantConfigData.description ||
      `AI assistant for ${assistantConfigData.business_name || 'your business'}`,
    params: {
      conciergeName: assistantConfigData.concierge_name || 'Assistant',
      businessName: assistantConfigData.business_name || 'Business',
      phoneNumber: assistantConfigData.business_phone || '',
    },
    stripeCheckoutSessionId: sessionId,
    paymentSessionId: paymentSessionId,
    plan: planName,
  };

  console.log('[ASSISTANT CREATION] Payload:', createAssistantPayload);

  const response = await fetch(`${origin}/api/Concierge/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createAssistantPayload),
  });

  console.log('[ASSISTANT CREATION] API response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Failed to read error response');
    throw new Error(`Assistant creation failed: ${response.status} ${errorText}`);
  }

  const result = (await response.json()) as CreateAssistantResult;
  console.log('[ASSISTANT CREATION] Success:', {
    assistantId: result.assistantId,
    pendingAssistantId: result.pendingAssistantId,
    message: result.message,
  });

  return result;
}

/**
 * Creates a default assistant for legacy flows
 */
export async function createDefaultAssistant(
  customerEmail: string,
  sessionId: string,
  origin: string
): Promise<CreateAssistantResult> {
  const businessName = customerEmail.split('@')[0] || 'Business';

  const assistantData = {
    name: `${businessName} Assistant`,
    description: `AI assistant for ${businessName}`,
    concierge_name: `${businessName} Concierge`,
    personality: 'professional and helpful',
    business_name: businessName,
    business_phone: '',
    share_phone_number: false,
    display_name: `${businessName} Assistant`,
  };

  console.log('[ASSISTANT CREATION] Default assistant data:', assistantData);

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

  const response = await fetch(`${origin}/api/Concierge/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createAssistantPayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Failed to read error response');
    throw new Error(`Default assistant creation failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as CreateAssistantResult;
}
