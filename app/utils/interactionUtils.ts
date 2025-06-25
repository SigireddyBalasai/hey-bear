import { createClient } from "@/utils/supabase/client";
import { isAdminRpc } from "./isAdminRpc";
import { Interaction } from "@/types/basics";

/**
 * Gets the internal user ID from the auth user ID
 * This is necessary because our database schema uses user_id but the auth system uses auth_user_id
 */

/**
 * Record an interaction in the database using the correct user ID mapping
 */
export async function recordInteraction(
  authUserId: string,
  assistantId: string | null,
  chat: string,
  request: string,
  response: string,
  tokenUsage: number,
  costEstimate: number,
  duration: number,
  isError: boolean = false,
) {
  const supabase = await createClient();

  try {
    if (!authUserId) {
      throw new Error(`Could not find user with auth_user_id: ${authUserId}`);
    }

    // Now insert the interaction with the correct user_id
    const interactionData: Interaction = {
      id: "", // or generate a UUID if required
      user_id: authUserId,
      assistant_id: assistantId ?? "",
      chat: chat as any, // cast to Json if needed
      request,
      response,
      token_usage: tokenUsage,
      input_tokens: null,
      output_tokens: null,
      cost_estimate: costEstimate,
      duration,
      is_error: isError,
      error_message: null,
      created_at: null,
      updated_at: null,
      model: null,
      metadata: null,
      interaction_time: null,
      session_id: null,
      source: null,
      status: null,
    };

    const { error } = await supabase
      .from("interactions")
      .insert(interactionData);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error saving interaction to Supabase:", error);
    return false;
  }
}
