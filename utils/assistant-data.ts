/**
 * Utility functions for fetching and manipulating assistant data
 * Provides backward compatibility between the old JSON params structure and new normalized tables
 */

import { Tables } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/client';

// Define type for normalized assistant data
export type NormalizedAssistantData = {
  assistant: Tables<'assistants'>;
  config: Tables<'assistant_configs'> | null;
  subscription: Tables<'assistant_subscriptions'> | null;
  usageLimits: Tables<'assistant_usage_limits'> | null;
  activity: Tables<'assistant_activity'> | null;
};

// Helper function to fetch assistant data from all tables
export async function getAssistantData(assistantId: string): Promise<NormalizedAssistantData | null> {
  const supabase = createClient();
  
  // Fetch the assistant record
  const { data: assistant, error: assistantError } = await supabase
    .from('assistants')
    .select('*')
    .eq('id', assistantId)
    .single();
  
  if (assistantError || !assistant) {
    console.error('Error fetching assistant:', assistantError);
    return null;
  }
  
  // Fetch from assistant_configs table
  const { data: config } = await supabase
    .from('assistant_configs')
    .select('*')
    .eq('id', assistantId)
    .single();
    
  // Fetch from assistant_subscriptions table
  const { data: subscription } = await supabase
    .from('assistant_subscriptions')
    .select('*')
    .eq('assistant_id', assistantId)
    .single();
    
  // Fetch from assistant_usage_limits table
  const { data: usageLimits } = await supabase
    .from('assistant_usage_limits')
    .select('*')
    .eq('assistant_id', assistantId)
    .single();
    
  // Fetch from assistant_activity table
  const { data: activity } = await supabase
    .from('assistant_activity')
    .select('*')
    .eq('assistant_id', assistantId)
    .single();
  
  return {
    assistant,
    config,
    subscription,
    usageLimits,
    activity
  };
}

// Create a compatibility layer to maintain backward compatibility with code that uses params
export function getParamsCompatObject(data: NormalizedAssistantData): Record<string, any> {
  // Create a params-like object from the normalized tables
  const paramsLike: Record<string, any> = {
    // Basic fields
    description: data.config?.description || null,
    conciergeName: data.config?.concierge_name || null,
    conciergePersonality: data.config?.concierge_personality || null,
    businessName: data.config?.business_name || null,
    sharePhoneNumber: data.config?.share_phone_number || false,
    phoneNumber: data.config?.business_phone || null,
    
    // Fields that were previously nested in subscription object
    plan: data.subscription?.plan || 'personal',
    
    // Add last_used_at from activity
    last_used_at: data.activity?.last_used_at || null,
    
    // Add subscription details as nested object for backward compatibility
    subscription: data.subscription ? {
      stripeSubscriptionId: data.subscription.stripe_subscription_id,
      plan: data.subscription.plan,
      status: data.subscription.status,
      currentPeriodEnd: data.subscription.current_period_end,
      createdAt: data.subscription.created_at
    } : null,
    
    // Add usage limits
    max_messages: data.usageLimits?.max_messages || 100,
    max_tokens: data.usageLimits?.max_tokens || 100000,
    max_documents: data.usageLimits?.max_documents || 5,
    max_webpages: data.usageLimits?.max_webpages || 5
  };
  
  // Include params field from original assistant if it exists
  if (data.assistant.params) {
    // Use type assertion to merge with existing params
    try {
      const existingParams = data.assistant.params as Record<string, any>;
      
      // Merge existing params with the new ones (new ones take precedence)
      Object.keys(existingParams).forEach(key => {
        if (!paramsLike.hasOwnProperty(key)) {
          paramsLike[key] = existingParams[key];
        }
      });
    } catch (e) {
      console.error('Error merging params:', e);
    }
  }
  
  return paramsLike;
}

// Update assistant data in both the new normalized tables and the legacy params field
export async function updateAssistantData(
  assistantId: string, 
  data: {
    config?: Partial<Tables<'assistant_configs'>>,
    subscription?: Partial<Tables<'assistant_subscriptions'>>,
    usageLimits?: Partial<Tables<'assistant_usage_limits'>>,
    activity?: Partial<Tables<'assistant_activity'>>
  }
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Start a transaction by performing all updates
    if (data.config) {
      const { error } = await supabase
        .from('assistant_configs')
        .upsert({
          id: assistantId,
          ...data.config
        });
      
      if (error) {
        console.error('Error updating assistant config:', error);
        return false;
      }
    }
    
    if (data.subscription) {
      const { error } = await supabase
        .from('assistant_subscriptions')
        .upsert({
          assistant_id: assistantId,
          ...data.subscription
        });
      
      if (error) {
        console.error('Error updating assistant subscription:', error);
        return false;
      }
    }
    
    if (data.usageLimits) {
      const { error } = await supabase
        .from('assistant_usage_limits')
        .upsert({
          assistant_id: assistantId,
          ...data.usageLimits
        });
      
      if (error) {
        console.error('Error updating assistant usage limits:', error);
        return false;
      }
    }
    
    if (data.activity) {
      const { error } = await supabase
        .from('assistant_activity')
        .upsert({
          assistant_id: assistantId,
          ...data.activity
        });
      
      if (error) {
        console.error('Error updating assistant activity:', error);
        return false;
      }
    }
    
    // For backward compatibility, also update the params field in the assistants table
    const assistantData = await getAssistantData(assistantId);
    if (assistantData) {
      const compatParams = getParamsCompatObject(assistantData);
      
      const { error } = await supabase
        .from('assistants')
        .update({
          params: compatParams
        })
        .eq('id', assistantId);
      
      if (error) {
        console.error('Error updating assistant params:', error);
        return false;
      }
    }
    
    return true;
  } catch (e) {
    console.error('Error in updateAssistantData:', e);
    return false;
  }
}

// Update last used timestamp for an assistant
export async function updateLastUsed(assistantId: string): Promise<boolean> {
  const now = new Date().toISOString();
  
  return updateAssistantData(assistantId, {
    activity: {
      last_used_at: now
    }
  });
}

// Helper to count message usage for an assistant
export async function incrementMessageCount(assistantId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Get current message count
    const { data, error } = await supabase
      .from('assistant_activity')
      .select('total_messages')
      .eq('assistant_id', assistantId)
      .single();
      
    if (error) {
      // If no record exists, create one
      const { error: insertError } = await supabase
        .from('assistant_activity')
        .insert({
          assistant_id: assistantId,
          total_messages: 1
        });
        
      if (insertError) {
        console.error('Error creating activity record:', insertError);
        return false;
      }
      
      return true;
    }
    
    // Increment message count
    const newCount = (data?.total_messages || 0) + 1;
    const { error: updateError } = await supabase
      .from('assistant_activity')
      .update({
        total_messages: newCount,
        last_used_at: new Date().toISOString()
      })
      .eq('assistant_id', assistantId);
      
    if (updateError) {
      console.error('Error updating message count:', updateError);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error incrementing message count:', e);
    return false;
  }
}