import { Tables } from "@/lib/db.types";
import { createClient } from '@/utils/supabase/client';

/**
 * AssistantConfig data structure
 */

/**
 * Assistant data structure with non-nullable fields
 */
export interface AssistantWithNonNullableFields {
  assistant: {
    id: string;
    name: string;
    is_starred?: boolean;
    created_at: string;
    updated_at?: string;
    assigned_phone_number?: string | null;
    pending?: boolean;
    user_id?: string;
  };
  config?: Tables<{schema:"assistants";table:"assistant_config"}>;
}

/**
 * Normalized Assistant Data structure that combines data from multiple tables
 */
export interface NormalizedAssistantData extends AssistantWithNonNullableFields {
  /**
   * Assistant subscription information
   */
  subscription?: Tables<{schema:'assistants';tables:'assistant_subscriptions'}> | null;
  
  /**
   * Usage limits for the assistant
   */
  usageLimits?: Tables<{schema:'assistants';tables:'assistant_usage_limits'}> | null;
  
  /**
   * Activity data for the assistant
   */
  activity?: Tables<{schema:'assistants';tables:'assistant_activity'}> | null;
  
  /**
   * Total message count
   */
  interactions_count?: number;
  
  /**
   * Timestamp of the last interaction
   */
  last_interaction_at?: string | null;
}

/**
 * Helper function to fetch normalized assistant data from API
 */
export async function fetchAssistantData(assistantId: string): Promise<NormalizedAssistantData | null> {
  try {
    const response = await fetch(`/api/assistants/${assistantId}`);
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Error fetching assistant data:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch assistant data:', error);
    return null;
  }
}

/**
 * Helper function to fetch all assistants for a user with normalized data
 */
export async function getUserAssistants(userId: string): Promise<NormalizedAssistantData[]> {
  try {
    const supabase = createClient();
    
    // First get all assistants for the user
    const { data: assistants, error: assistantsError } = await supabase
      .schema('assistants')
      .from('assistants')
      .select('*')
      .eq('user_id', userId);
      
    if (assistantsError || !assistants) {
      console.error('Error fetching user assistants:', assistantsError);
      return [];
    }
    
    // For each assistant, fetch related data
    const normalizedAssistants: NormalizedAssistantData[] = await Promise.all(
      assistants.map(async (assistant) => {
        // Get assistant config
        const { data: rawConfig } = await supabase
          .schema('assistants')
          .from('assistant_configs')
          .select('*')
          .eq('assistant_id', assistant.id)
          .single();
          
        // Transform config to match AssistantConfig interface
        const config = rawConfig 
          ? {
              id: rawConfig.id,
              assistant_id: assistant.id,
              model: "default_model", // Use default model since 'model' property doesn't exist
              instructions: rawConfig.concierge_personality || undefined,
              metadata: rawConfig, // Store all original fields in metadata
              created_at: rawConfig.created_at,
              updated_at: rawConfig.updated_at,
            } 
          : undefined;
          
        // Get subscription information
        const { data: subscription } = await supabase
          .schema('assistants')
          .from('assistant_subscriptions')
          .select('*')
          .eq('assistant_id', assistant.id)
          .single();
          
        // Get usage limits
        const { data: usageLimits } = await supabase
          .schema('assistants')
          .from('assistant_usage_limits')
          .select('*')
          .eq('assistant_id', assistant.id)
          .single();
          
        // Get activity data (most recent)
        const { data: activity } = await supabase
          .schema('assistants')
          .from('assistant_activity')
          .select('*')
          .eq('assistant_id', assistant.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
          
        // Convert null values to undefined for type compatibility
        return {
          assistant: {
            ...assistant,
            is_starred: assistant.is_starred === null ? undefined : assistant.is_starred,
            pending: assistant.pending === null ? undefined : assistant.pending
          },
          config: config || undefined,
          subscription: subscription || undefined,
          usageLimits: usageLimits || undefined,
          activity: activity || undefined
        };
      })
    );
    
    return normalizedAssistants;
  } catch (error) {
    console.error('Failed to fetch user assistants:', error);
    return [];
  }
}