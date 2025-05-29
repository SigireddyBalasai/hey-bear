import type { Tables, TablesUpdate } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';

// SupabaseClient might be needed if we were to type the awaited client explicitly,
// but the createClient from server is likely already typed.
// import type { SupabaseClient } from '@supabase/supabase-js';

// Define related row types based on the database schema
export type AssistantRow = Tables<{ schema: 'assistants' }, 'assistants'>;
export type AssistantSubscriptionRow = Tables<{ schema: 'assistants' }, 'assistant_subscriptions'>;
export type AssistantUsageLimitsRow = Tables<{ schema: 'assistants' }, 'assistant_usage_limits'>;
export type AssistantActivityRow = Tables<{ schema: 'assistants' }, 'assistant_activity'>;

/**
 * Normalized structure for assistant data, combining information from multiple tables/views.
 * This structure is used by client-side components and utilities, often populated by
 * functions in assistant-data-client.ts or mock-data.ts.
 */
export interface NormalizedAssistantData {
  assistant: AssistantRow;
  config?: AssistantConfigRow;
  subscription?: AssistantSubscriptionRow;
  usageLimits?: AssistantUsageLimitsRow;
  activity?: AssistantActivityRow; // Represents the row from assistant_activity table
  interactions_count: number; // Total number of interactions
  last_interaction_at: string | null; // Timestamp of the last interaction
}

export type AssistantConfigUpdateData = TablesUpdate<{ schema: 'assistants' }, 'assistant_configs'>;
export type AssistantConfigRow = Tables<{ schema: 'assistants' }, 'assistant_configs'>;
export type AssistantDetailViewRow = Tables<{ schema: 'assistants' }, 'assistant_detail_view'>;

/**
 * Updates data in the 'assistant_configs' table for a given assistant ID.
 * NOTE: This function will encounter TypeScript errors if the Supabase client
 * from '@/utils/supabase/server' is scoped to the "public" schema by default,
 * as 'assistant_configs' resides in the "assistants" schema.
 * @param assistantId The ID of the assistant whose config needs updating.
 * @param data The data to update.
 * @returns The updated assistant config row or null.
 */
export async function updateAssistantConfig(
  assistantId: string,
  data: AssistantConfigUpdateData
): Promise<AssistantConfigRow | null> {
  const supabase = await createClient(); // createClient() returns a Promise

  // The following .from() call expects 'assistant_configs' to be in the client's default schema (likely "public").
  // This will error if the client cannot access the "assistants" schema directly.
  const { data: updatedData, error } = await supabase
    .schema('assistants')
    .from('assistant_configs')
    .update(data)
    .eq('id', assistantId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating assistant_configs for assistant ${assistantId}:`, error.message);
    throw new Error(
      `Failed to update assistant_configs for assistant ${assistantId}: ${error.message}`
    );
  }
  return updatedData;
}

/**
 * Fetches detailed data for a given assistant ID from the 'assistant_detail_view'.
 * NOTE: This function will also encounter TypeScript errors if the Supabase client
 * is scoped to the "public" schema, as 'assistant_detail_view' is in the "assistants" schema.
 * @param assistantId The ID of the assistant.
 * @returns The assistant detail view row or null.
 */
export async function getAssistantDetail(
  assistantId: string
): Promise<AssistantDetailViewRow | null> {
  const supabase = await createClient(); // createClient() returns a Promise

  // The following .from() call expects 'assistant_detail_view' to be in the client's default schema.
  const { data: assistantData, error } = await supabase
    .schema('assistants')
    .from('assistant_detail_view')
    .select('*')
    .eq('id', assistantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Standard Supabase code for "Not found"
      console.log(`No assistant_detail_view data found for assistant ${assistantId}.`);
      return null;
    }
    console.error(
      `Error fetching assistant_detail_data for assistant ${assistantId}:`,
      error.message
    );
    throw new Error(
      `Failed to fetch assistant_detail_data for assistant ${assistantId}: ${error.message}`
    );
  }
  return assistantData;
}

/**
 * Updates data in the 'assistants' table for a given assistant ID.
 * @param assistantId The ID of the assistant whose data needs updating.
 * @param data The data to update.
 * @returns The updated assistant row or null.
 */
export async function updateAssistantData(
  assistantId: string,
  data: Partial<AssistantRow>
): Promise<AssistantRow | null> {
  const supabase = await createClient();

  const { data: updatedData, error } = await supabase
    .schema('assistants')
    .from('assistants')
    .update(data)
    .eq('id', assistantId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating assistants table for assistant ${assistantId}:`, error.message);
    throw new Error(
      `Failed to update assistants table for assistant ${assistantId}: ${error.message}`
    );
  }
  return updatedData;
}
