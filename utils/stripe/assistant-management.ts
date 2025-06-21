import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db.types';

// Database types for assistant management
type AssistantRow = Database['public']['Tables']['assistants']['Row'];
type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];

// Helper function to generate a valid Pinecone name
function generatePineconeName(name: string): string {
  // Replace spaces and special characters with underscores, ensure lowercase
  let safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Ensure it's not longer than 45 chars (leaving room for the random suffix)
  safeName = safeName.substring(0, 45);

  // Add a random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${safeName}_${randomSuffix}`;
}

export type AssistantConfigData = Pick<
  AssistantConfigRow,
  | 'display_name'
  | 'description'
  | 'concierge_name'
  | 'personality'
  | 'business_name'
  | 'business_phone'
  | 'share_phone_number'
> & {
  name?: string; // from assistants table
};

export type AssistantData = Pick<AssistantRow, 'name'> &
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
 * Fetches assistant configuration from payment session
 */
export async function getAssistantDataFromPaymentSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string
): Promise<AssistantData | null> {
  console.log('Looking up assistant data from payment_sessions table with sessionId:', sessionId);

  try {
    const { data: paymentSession, error: paymentSessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (paymentSessionError) {
      console.error('Error fetching payment session:', paymentSessionError);

      return null;
    }

    if (!paymentSession?.assistant_config_data) {
      console.log('No assistant config data found in payment session');

      return null;
    }

    const configData = paymentSession.assistant_config_data as AssistantConfigData;

    const assistantData: AssistantData = {
      name: configData.display_name || configData.name || 'New Assistant',
      description: configData.description,
      concierge_name: configData.concierge_name,
      personality: configData.personality,
      business_name: configData.business_name,
      business_phone: configData.business_phone,
      share_phone_number: configData.share_phone_number || false,
      display_name: configData.display_name,
    };

    console.log('Extracted assistant data from payment session:', {
      name: assistantData.name,
      businessName: assistantData.business_name,
      conciergeName: assistantData.concierge_name,
    });

    return assistantData;
  } catch (error) {
    console.error('Error retrieving assistant data from payment session:', error);

    return null;
  }
}

/**
 * Creates assistant with configuration
 */
export async function createAssistantWithConfig(
  supabase: SupabaseClient<Database>,
  userId: string,
  assistantData: AssistantData
): Promise<string | null> {
  console.log('Creating assistant from webhook with data:', assistantData);

  try {
    // Check if assistant already exists
    const { data: existingAssistant, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('user_id', userId)
      .eq('name', assistantData.name)
      .single();

    if (assistantError && assistantError.code !== 'PGRST116') {
      console.error('Error checking for existing assistant:', assistantError);

      return null;
    }

    if (existingAssistant) {
      console.log('Assistant already exists:', existingAssistant.id);

      return existingAssistant.id;
    }

    // Create assistant
    const { data: newAssistant, error: createError } = await supabase
      .from('assistants')
      .insert({
        user_id: userId,
        name: assistantData.name,
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating assistant in webhook:', createError);

      return null;
    }

    if (!newAssistant) {
      console.error('No assistant data returned from insert');

      return null;
    }

    console.log('Successfully created assistant in webhook:', newAssistant.id);

    // Create assistant config
    const conciergeName = assistantData.concierge_name || assistantData.name || 'Assistant';
    const businessName = assistantData.business_name || '';
    const systemPrompt = `You are ${conciergeName}, a helpful assistant for ${businessName || 'the user'}. Your personality is ${(assistantData.personality || 'Business Casual').toLowerCase()}. ${assistantData.description || ''}`;
    const pineconeName = generatePineconeName(assistantData.name);

    const { error: configError } = await supabase.from('assistant_configs').insert({
      id: newAssistant.id,
      description: assistantData.description,
      display_name: assistantData.display_name || assistantData.name,
      concierge_name: assistantData.concierge_name,
      personality: assistantData.personality,
      business_name: assistantData.business_name,
      business_phone: assistantData.business_phone,
      share_phone_number: assistantData.share_phone_number,
      system_prompt: systemPrompt,
      pinecone_name: pineconeName,
    });

    if (configError) {
      console.error('Error creating assistant config in webhook:', configError);
      // Assistant was created but config failed - still return assistant ID
    } else {
      console.log('Successfully created assistant config in webhook');
    }

    return newAssistant.id;
  } catch (error) {
    console.error('Error in createAssistantWithConfig:', error);

    return null;
  }
}
