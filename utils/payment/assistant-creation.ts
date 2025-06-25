import type { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

import { getPineconeClient } from "@/lib/pinecone";
import { getSubscriptionPlanDetails } from "@/lib/subscription-plans";
import type {
  AssistantConfigData,
  CreateAssistantResult,
} from "@/types/api.types";
import type { Database } from "@/types/db.types";
import { createClient } from "@/utils/supabase/server-admin";

function generatePineconeName(base: string): string {
  let prefix = base.toLowerCase().replaceAll(/[^a-z0-9]/g, "-");

  prefix = prefix.slice(0, 40);
  const timestamp = Date.now().toString().slice(-6); // Use timestamp for uniqueness

  return `${prefix}-${timestamp}`;
}

/**
 * Creates an assistant using the assistant configuration data
 * Updated to create directly in database instead of making API call
 */
export async function createAssistantFromConfig(
  assistantConfigData: AssistantConfigData,
  sessionId: string,
  paymentSessionId: string,
  planId: string,
  origin: string,
  userId?: string,
): Promise<CreateAssistantResult> {
  const planDetails = getSubscriptionPlanDetails(planId);

  if (!planDetails) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const planName = planDetails.id;

  const assistantName =
    assistantConfigData.display_name ??
    (assistantConfigData.business_name
      ? `${assistantConfigData.business_name} Assistant`
      : "Business Assistant");

  const description =
    assistantConfigData.description ??
    `AI assistant for ${assistantConfigData.business_name ?? "your business"}`;

  try {
    // Create assistant directly in database instead of API call
    return await createAssistantDirect({
      name: assistantName,
      description,
      concierge_name: assistantConfigData.concierge_name ?? "Assistant",
      business_name: assistantConfigData.business_name ?? "Business",
      business_phone: assistantConfigData.business_phone ?? "",
      plan: planName,
      stripeCheckoutSessionId: sessionId,
      paymentSessionId,
      userId,
    });
  } catch {
    // Fallback to API call if direct creation fails
    return await createAssistantViaAPI(
      assistantConfigData,
      sessionId,
      paymentSessionId,
      planName,
      origin,
    );
  }
}

/**
 * Creates assistant directly in database (preferred method for webhooks)
 */
async function createAssistantDirect(params: {
  name: string;
  description: string;
  concierge_name: string;
  business_name: string;
  business_phone: string;
  plan: string;
  stripeCheckoutSessionId: string;
  paymentSessionId: string;
  userId?: string;
}): Promise<CreateAssistantResult> {
  const supabase: SupabaseClient<Database> = await createClient();

  // Get user ID from payment session if not provided
  let resolvedUserId = params.userId;

  if (!resolvedUserId) {
    const { data: paymentSession } = await supabase
      .from("payment_sessions")
      .select("user_id")
      .eq("id", params.paymentSessionId)
      .single();

    resolvedUserId = paymentSession?.user_id ?? undefined;
  }

  if (!resolvedUserId) {
    throw new Error("User ID not found for assistant creation");
  }

  // Create the assistant record
  const assistantId = uuidv4();
  const now = new Date().toISOString();

  // 1. Create the main assistant record
  const assistantData = {
    id: assistantId,
    name: params.name,
    user_id: resolvedUserId,
    is_active: true,
    pending: false,
    created_at: now,
    updated_at: now,
  };

  const { error: assistantError } = await supabase
    .from("assistants")
    .insert(assistantData)
    .select()
    .single();

  if (assistantError) {
    throw new Error(`Failed to create assistant: ${assistantError.message}`);
  }

  // 2. Create the assistant config record
  const configData = {
    id: assistantId, // Same ID as assistant
    business_name: params.business_name,
    business_phone: params.business_phone,
    concierge_name: params.concierge_name,
    description: params.description,
    display_name: params.name,
    personality: "professional and helpful",
    pinecone_name: generatePineconeName(params.name),
    share_phone_number: false,
    created_at: now,
    updated_at: now,
  };

  const { error: configError } = await supabase
    .from("assistant_configs")
    .insert(configData);

  if (configError) {
    // Clean up assistant record if config creation fails
    await supabase.from("assistants").delete().eq("id", assistantId);
    throw new Error(
      `Failed to create assistant config: ${configError.message}`,
    );
  }

  // 2.5. Create Pinecone assistant
  try {
    const pinecone = getPineconeClient();
    const systemPrompt = `You are ${params.concierge_name}, a helpful assistant for ${params.business_name ?? "the user"}. Your personality is professional and helpful. ${params.description ?? ""}`;

    await pinecone.createAssistant({
      name: configData.pinecone_name,
      instructions: systemPrompt,
    });
  } catch {
    // Don't fail the entire creation if Pinecone fails, but log it
    // The assistant can still be used, just without file capabilities initially
  }

  // 3. Create assistant subscription record
  const planDetails = getSubscriptionPlanDetails(params.plan);
  const subscriptionData = {
    assistant_id: assistantId,
    plan_id: params.plan,
    plan_name: planDetails?.id ?? params.plan,
    status: "active" as Database["public"]["Enums"]["subscription_status"],
    payment_session_id: params.paymentSessionId,
    message_limit: planDetails?.limits.maxMessages ?? 1000,
    document_limit: planDetails?.limits.maxDocuments ?? 10,
    webpage_limit: planDetails?.limits.maxWebpages ?? 5,
    created_at: now,
    updated_at: now,
  };

  const { error: subscriptionError } = await supabase
    .from("assistant_subscriptions")
    .insert(subscriptionData);

  if (subscriptionError) {
    // Clean up previous records if subscription creation fails
    await supabase.from("assistant_configs").delete().eq("id", assistantId);
    await supabase.from("assistants").delete().eq("id", assistantId);
    throw new Error(
      `Failed to create assistant subscription: ${subscriptionError.message}`,
    );
  }

  // 4. Create assistant activity record
  const activityData = {
    assistant_id: assistantId,
    created_at: now,
  };

  const { error: activityError } = await supabase
    .from("assistant_activity")
    .insert(activityData);

  if (activityError) {
    // Failed to create activity record - not critical
  }

  // 5. Create usage limits record
  if (planDetails) {
    const usageLimitsData = {
      assistant_id: assistantId,
      max_messages: planDetails.limits.maxMessages,
      max_tokens: planDetails.limits.maxTokens,
      document_limit: planDetails.limits.maxDocuments,
      webpage_limit: planDetails.limits.maxWebpages,
      created_at: now,
    };

    const { error: limitsError } = await supabase
      .from("assistant_usage_limits")
      .insert(usageLimitsData);

    if (limitsError) {
      // Failed to create usage limits - not critical
    }
  }

  return {
    assistantId,
    pendingAssistantId: assistantId,
    message: "Assistant created successfully",
  };
}

/**
 * Fallback method using API call (original implementation)
 */
async function createAssistantViaAPI(
  assistantConfigData: AssistantConfigData,
  sessionId: string,
  paymentSessionId: string,
  planName: string,
  origin: string,
): Promise<CreateAssistantResult> {
  const createAssistantPayload = {
    assistantName:
      assistantConfigData.display_name ??
      (assistantConfigData.business_name
        ? `${assistantConfigData.business_name} Assistant`
        : "Business Assistant"),
    description:
      assistantConfigData.description ??
      `AI assistant for ${assistantConfigData.business_name ?? "your business"}`,
    params: {
      conciergeName: assistantConfigData.concierge_name ?? "Assistant",
      businessName: assistantConfigData.business_name ?? "Business",
      phoneNumber: assistantConfigData.business_phone ?? "",
    },
    stripeCheckoutSessionId: sessionId,
    paymentSessionId,
    plan: planName,
  };

  // Use environment variable for base URL in production
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? origin ?? "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/Concierge/create`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createAssistantPayload),
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to read error response");

    throw new Error(
      `Assistant creation failed: ${response.status} ${errorText}`,
    );
  }

  return (await response.json()) as CreateAssistantResult;
}

/**
 * Creates a default assistant for legacy flows
 */
export async function createDefaultAssistant(
  customerEmail: string,
  sessionId: string,
  origin: string,
): Promise<CreateAssistantResult> {
  const businessName = customerEmail.split("@")[0] || "Business";

  const assistantData = {
    name: `${businessName} Assistant`,
    description: `AI assistant for ${businessName}`,
    concierge_name: `${businessName} Concierge`,
    personality: "professional and helpful",
    business_name: businessName,
    business_phone: "",
    share_phone_number: false,
    display_name: `${businessName} Assistant`,
  };

  const createAssistantPayload = {
    assistantName: assistantData.name,
    description: assistantData.description,
    params: {
      conciergeName: assistantData.concierge_name,
      businessName: assistantData.business_name,
      phoneNumber: assistantData.business_phone,
    },
    stripeCheckoutSessionId: sessionId,
    plan: "personal",
  };

  // Use environment variable for base URL in production
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? origin ?? "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/Concierge/create`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createAssistantPayload),
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Failed to read error response");

    throw new Error(
      `Default assistant creation failed: ${response.status} ${errorText}`,
    );
  }

  return (await response.json()) as CreateAssistantResult;
}
