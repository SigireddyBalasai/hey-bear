import { NextRequest, NextResponse } from "next/server";
import { getPineconeClient } from "@/lib/pinecone";
import { createClient } from "@/utils/supabase/server";
import { Tables } from "@/lib/db.types";
import { checkAssistantSubscription } from "@/utils/subscriptions";
import { trackUsage, isLimitReached, UsageType } from "@/utils/usage-limits";

type Interactions = Tables<"interactions">;
type Assistant = Tables<"assistants">;

function generateBehaviorPrompt(assistantName: string, params: any): string {
  const conciergeName = params?.conciergeName || assistantName;
  const businessName = params?.businessName || "";
  const personality =
    params?.conciergePersonality?.toLowerCase() || "business casual";
  let prompt = "";

  if (personality.includes("friendly")) {
    prompt = `Hey there! This is ${conciergeName} from ${businessName} 😊 What can I do for you?`;
  } else if (personality.includes("formal")) {
    prompt = `Hello, this is ${conciergeName} representing ${businessName}. How may I assist you?`;
  } else {
    prompt = `Hi! ${conciergeName} here with ${businessName} — what can I help with today?`;
  }

  prompt += `\n\nAs ${conciergeName}, I represent ${businessName || "this business"} directly. I'll always speak as a helpful, knowledgeable employee—not like a search engine or AI assistant. I'll never reference "search results" or say phrases like "this appears to be." I know the business well and speak with a ${personality} tone throughout our conversation.`;

  return prompt;
}

export async function POST(req: NextRequest) {
  const requestTimestamp = new Date();
  console.log(`[${requestTimestamp.toISOString()}] No-Show chat API called`);

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 },
      );
    }

    const { assistantId, message, systemOverride, userPhone } = body;
    if (!assistantId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const subscriptionCheck = await checkAssistantSubscription(assistantId);
    if (!subscriptionCheck.isActive) {
      return NextResponse.json(
        {
          error: "Subscription required",
          details:
            "This assistant requires an active subscription to use chat functionality",
          subscription: {
            status: subscriptionCheck.status || "inactive",
            plan: subscriptionCheck.plan,
          },
        },
        { status: 402 },
      );
    }

    const isLimitExceeded = await isLimitReached(
      assistantId,
      UsageType.MESSAGE_RECEIVED,
    );
    if (isLimitExceeded) {
      return NextResponse.json(
        {
          error: "Usage limit reached",
          details:
            "This No-Show has reached its monthly message limit. Please upgrade your plan or wait until next month to continue the conversation.",
          limitReached: true,
        },
        { status: 429 },
      );
    }

    if (!userPhone) {
      await trackUsage(assistantId, UsageType.MESSAGE_RECEIVED);
    }

    // Always read assistant data from assistant_detail_view
    const supabase = await createClient();
    const { data: assistantData, error: assistantError } = await supabase
      .from("assistant_detail_view")
      .select("*")
      .eq("id", assistantId)
      .single();

    if (assistantError || !assistantData) {
      return NextResponse.json({ error: "No-Show not found" }, { status: 404 });
    }

    if (!assistantData.pinecone_name) {
      return NextResponse.json(
        { error: "Invalid No-Show configuration: missing Pinecone name" },
        { status: 500 },
      );
    }

    try {
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json(
          { error: "Pinecone client initialization failed" },
          { status: 500 },
        );
      }

      const assistant = pinecone.Assistant(assistantData.pinecone_name);
      if (!assistant) {
        return NextResponse.json(
          { error: "Failed to create No-Show" },
          { status: 500 },
        );
      }

      const messages = [];
      if (!systemOverride) {
        messages.push({
          role: "assistant",
          content: generateBehaviorPrompt(assistantData.assistant_name ?? "", {
            conciergeName: assistantData.assistant_name ?? "",
            businessName: assistantData.business_name,
            conciergePersonality: assistantData.personality,
          }),
        });
      } else {
        messages.push({ role: "assistant", content: systemOverride });
      }
      messages.push({ role: "user", content: message });

      let response;
      try {
        response = await assistant.chat({ messages });
      } catch (assistantError: unknown) {
        const errorMessage =
          assistantError instanceof Error
            ? assistantError.message
            : String(assistantError);
        throw new Error(`Failed to get response from No-Show: ${errorMessage}`);
      }

      const responseTimestamp = new Date();
      const responseDuration =
        responseTimestamp.getTime() - requestTimestamp.getTime();

      if (!response || !response.message) {
        return NextResponse.json(
          { error: "No-Show returned no response" },
          { status: 500 },
        );
      }

      if (!userPhone) {
        await trackUsage(assistantId, UsageType.MESSAGE_SENT);
      }

      const tokenCount = response.usage?.totalTokens || 0;
      const costRate = 0.002 / 1000;
      const costEstimate = tokenCount * costRate;

      const nowISOString = new Date().toISOString();
      const interactionData: Omit<Interactions, "id"> = {
        assistant_id: assistantId,
        chat: message ? { message } : null,
        request: message ? { message } : null,
        response: response.message?.content
          ? { content: response.message.content }
          : null,
        duration: responseDuration,
        interaction_time: requestTimestamp.toISOString(),
        created_at: nowISOString,
        updated_at: nowISOString,
        user_id: null,
        cost_estimate: costEstimate > 0 ? costEstimate : null,
        is_error: false,
        token_usage: tokenCount > 0 ? tokenCount : null,
        input_tokens: response.usage?.promptTokens || null,
        output_tokens: response.usage?.completionTokens || null,
        error_message: null,
        metadata: null,
        model: null,
        session_id: null,
        source: null,
        status: null,
      };

      await supabase.from("interactions").insert(interactionData);
      await supabase
        .from("assistants")
        .update({ updated_at: nowISOString })
        .eq("id", assistantId);

      return NextResponse.json({
        response: response.message?.content || "",
        tokens: tokenCount,
        cost: costEstimate,
        timing: {
          requestTimestamp: requestTimestamp.toISOString(),
          responseTimestamp: responseTimestamp.toISOString(),
          responseDuration,
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to process request with the No-Show" },
        { status: 500 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
