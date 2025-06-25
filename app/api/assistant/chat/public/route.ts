import { NextRequest, NextResponse } from "next/server";
import { getPineconeClient } from "@/lib/pinecone";
import { createClient as createServiceClient } from "@/utils/supabase/server-admin";
import { Tables } from "@/lib/db.types";

// Define table types
type Interactions = Tables<"interactions">;
type Assistant = Tables<"assistants">;

// A simple token for webhook authentication
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "webhook-token-123456";

export async function POST(req: NextRequest) {
  // Record the request timestamp
  const requestTimestamp = new Date();

  try {
    // Expanded internal request validation
    const isInternalRequest =
      // Check webhook token
      req.headers.get("X-Webhook-Token") === WEBHOOK_TOKEN ||
      // Check if it's an internal request
      req.headers.get("X-Internal-Request") === "1" ||
      // Check user agent
      req.headers.get("user-agent")?.includes("TwilioWebhook") ||
      req.headers.get("user-agent")?.includes("node-fetch") ||
      req.headers.get("user-agent")?.includes("undici");

    if (!isInternalRequest) {
      console.error("Unauthorized request:", {
        token: req.headers.get("X-Webhook-Token"),
        userAgent: req.headers.get("user-agent"),
        internal: req.headers.get("X-Internal-Request"),
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 },
      );
    }

    const { assistantId, message, userId, systemOverride, userPhone } = body;

    // Validate required fields
    if (!assistantId || !message || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Use non-auth client
    const supabase = await createServiceClient();

    // Fetch the assistant from the database to get its Pinecone name
    const { data: assistantData, error: assistantError } = await supabase
      .from("assistant_detail_view")
      .select("*")
      .eq("id", assistantId)
      .maybeSingle();

    if (
      assistantError ||
      !assistantData ||
      typeof assistantData !== "object" ||
      !("pinecone_name" in assistantData)
    ) {
      console.error("Error fetching assistant:", assistantError);
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 },
      );
    }

    const { pinecone_name, assistant_name: assistantName } = assistantData;

    if (!pinecone_name) {
      return NextResponse.json(
        { error: "Invalid assistant configuration: missing Pinecone name" },
        { status: 500 },
      );
    }

    // Handle Pinecone assistant
    try {
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json(
          { error: "Pinecone client initialization failed" },
          { status: 500 },
        );
      }

      console.log(`Using Pinecone assistant name: ${pinecone_name}`);
      const assistant = pinecone.Assistant(pinecone_name);
      if (!assistant) {
        return NextResponse.json(
          { error: "Failed to create assistant" },
          { status: 500 },
        );
      }

      // Create messages array with proper role validation
      const messages = [];

      // Add system message first if provided
      if (systemOverride) {
        messages.push({
          role: "assistant", // Use 'assistant' for system messages
          content: systemOverride,
        });
      }

      // Add user message
      messages.push({
        role: "user",
        content: message,
      });

      // Use only valid options for Pinecone Assistant API
      const response = await assistant.chat({ messages });

      // Record the response timestamp
      const responseTimestamp = new Date();
      const responseDuration =
        responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds

      if (!response || !response.message) {
        return NextResponse.json(
          { error: "Assistant returned no response" },
          { status: 500 },
        );
      }

      // Extract token usage and cost information from the response if available
      const tokenCount = response.usage?.totalTokens || 0;
      // Simple cost estimation (adjust the rate based on your actual pricing)
      const costRate = 0.002 / 1000; // Example: $0.002 per 1000 tokens
      const costEstimate = tokenCount * costRate;

      // Record additional metadata for context if provided
      const chatMetadata = userPhone
        ? JSON.stringify({ type: "sms", userPhone, message })
        : message;

      // Save interaction to Supabase with proper typing
      const interactionData: Interactions = {
        assistant_id: assistantId,
        user_id: userId,
        request: message,
        response: response.message?.content || "",
        chat: chatMetadata,
        created_at: null,
        interaction_time: requestTimestamp.toISOString(),
        duration: responseDuration,
        input_tokens: response.usage?.promptTokens || null,
        output_tokens: response.usage?.completionTokens || null,
        token_usage: tokenCount > 0 ? tokenCount : null,
        cost_estimate: costEstimate > 0 ? costEstimate : null,
        is_error: false,
        error_message: null,
        metadata: null,
        id: "",
        model: null,
        session_id: null,
        source: null,
        status: null,
        updated_at: null,
      };

      const { error: interactionError } = await supabase
        .from("interactions")
        .insert(interactionData);

      if (interactionError) {
        console.error(
          "Error saving interaction to Supabase:",
          interactionError,
        );
      }

      // Update assistant usage statistics
      const { error: usageError } = await supabase
        .from("assistants")
        .update({
          updated_at: requestTimestamp.toISOString(),
        })
        .eq("id", assistantId);

      if (usageError) {
        console.error("Error updating assistant usage:", usageError);
      }

      return NextResponse.json({
        response: response.message?.content || "",
        tokens: tokenCount,
        cost: costEstimate,
        usage: response.usage,
        timing: {
          requestTimestamp: requestTimestamp.toISOString(),
          responseTimestamp: responseTimestamp.toISOString(),
          responseDuration: responseDuration,
        },
      });
    } catch (assistantError) {
      console.error("Error interacting with assistant:", assistantError);
      return NextResponse.json(
        { error: "Failed to process request with the assistant" },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
