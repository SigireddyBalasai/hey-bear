// Import the new assistant data utility
import { getAssistantData, updateAssistantData } from '@/utils/assistant-data';
import { createClient } from '@/utils/supabase/client';

// Define usage types
export enum UsageType {
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  DOCUMENT_UPLOADED = 'document_uploaded',
  WEBPAGE_PROCESSED = 'webpage_processed',
  TOKEN_USAGE = 'token_usage'
}

// Define the subscription details type
export type AssistantSubscriptionDetails = {
  subscription_id: string;
  stripe_subscription_id: string;
  plan: string;
  status: string;
  current_period_end: string;
  is_active: boolean;
  days_remaining: number;
  max_messages: number;
  max_tokens: number;
  max_documents: number;
  max_webpages: number;
};

/**
 * Get usage limits for a specific assistant based on their subscription plan
 */
export async function getAssistantUsageLimits(assistantId: string): Promise<AssistantSubscriptionDetails> {
  try {
    const supabase = await createClient();
    
    // First try to use the RPC function directly from the database
    const { data, error } = await supabase
      .rpc('get_assistant_subscription_details', { 
        p_assistant_id: assistantId 
      });
    
    if (!error && data && data.length > 0) {
      // Return the first plan from the RPC function results
      return data[0];
    }
    
    // If RPC fails, use the new normalized structure as fallback
    const assistantData = await getAssistantData(assistantId);
    if (!assistantData) {
      throw new Error('Assistant not found');
    }
    
    const { subscription, usageLimits } = assistantData;
    
    // Construct subscription details from the normalized data
    return {
      subscription_id: subscription?.id || '',
      stripe_subscription_id: subscription?.stripe_subscription_id || '',
      plan: subscription?.plan || 'Free',
      status: subscription?.status || 'inactive',
      current_period_end: subscription?.current_period_end || '',
      is_active: subscription?.status === 'active' || subscription?.status === 'trialing',
      days_remaining: subscription?.current_period_end 
        ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
        : 0,
      max_messages: usageLimits?.max_messages || 50,
      max_tokens: usageLimits?.max_tokens || 50000,
      max_documents: usageLimits?.max_documents || 1,
      max_webpages: usageLimits?.max_webpages || 1
    };
  } catch (err) {
    console.error('Error getting assistant usage limits:', err);
    // Return default values if function fails
    return {
      subscription_id: '',
      stripe_subscription_id: '',
      plan: 'Free',
      status: 'inactive',
      current_period_end: '',
      is_active: false,
      days_remaining: 0,
      max_messages: 50,
      max_tokens: 50000,
      max_documents: 1,
      max_webpages: 1
    };
  }
}

/**
 * Check if an assistant has exceeded their usage limits
 */
export async function checkUsageLimits(
  assistantId: string, 
  type: UsageType
): Promise<{
  hasReachedLimit: boolean;
  currentUsage: number;
  limit: number;
}> {
  try {
    // Get the assistant's subscription details
    const limits = await getAssistantUsageLimits(assistantId);
    
    // Only apply limits if the subscription is active
    if (!limits.is_active) {
      return { hasReachedLimit: true, currentUsage: 0, limit: 0 };
    }
    
    // Get current usage statistics
    const usageStats = await getAssistantUsageStats(assistantId);
    
    // Check based on usage type
    switch (type) {
      case UsageType.MESSAGE_RECEIVED:
      case UsageType.MESSAGE_SENT:
        return {
          hasReachedLimit: usageStats.messages.used >= limits.max_messages,
          currentUsage: usageStats.messages.used,
          limit: limits.max_messages
        };
      
      case UsageType.TOKEN_USAGE:
        return {
          hasReachedLimit: usageStats.tokens.used >= limits.max_tokens,
          currentUsage: usageStats.tokens.used,
          limit: limits.max_tokens
        };
        
      case UsageType.DOCUMENT_UPLOADED:
        return {
          hasReachedLimit: usageStats.documents.used >= limits.max_documents,
          currentUsage: usageStats.documents.used,
          limit: limits.max_documents
        };
        
      case UsageType.WEBPAGE_PROCESSED:
        return {
          hasReachedLimit: usageStats.webpages.used >= limits.max_webpages,
          currentUsage: usageStats.webpages.used,
          limit: limits.max_webpages
        };
        
      default:
        return { hasReachedLimit: false, currentUsage: 0, limit: 0 };
    }
  } catch (err) {
    console.error('Error checking usage limits:', err);
    // Be conservative on error - assume limit has been reached
    return { hasReachedLimit: true, currentUsage: 0, limit: 0 };
  }
}

// Return type uses the structure expected by the UI component
type UsageStatsResult = {
  messages: { used: number; limit: number; remaining: number };
  documents: { used: number; limit: number; remaining: number };
  webpages: { used: number; limit: number; remaining: number };
  tokens: { used: number; limit: number; remaining: number };
  lastReset: string;
};

/**
 * Get current usage statistics for an assistant
 */
export async function getUsageStats(assistantId: string): Promise<UsageStatsResult> {
  try {
    // Get the subscription limits
    const limits = await getAssistantUsageLimits(assistantId);
    
    const supabase = await createClient();
    
    // Get usage data for the assistant within the current billing period
    let startDate = new Date();
    let endDate = new Date();
    
    if (limits.current_period_end) {
      // Use the billing period if available
      const periodEnd = new Date(limits.current_period_end);
      const monthInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      startDate = new Date(periodEnd.getTime() - monthInMs);
      endDate = periodEnd;
    } else {
      // Default to last 30 days
      startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    }
    
    // Format dates for the database query
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Get usage from activity and other tables
    const assistantData = await getAssistantData(assistantId);
    
    // Query for actual usage from interactions
    const { data } = await supabase
      .rpc('get_assistant_usage', { 
        p_assistant_id: assistantId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      });
      
    // Extract usage numbers
    const usageData = (data && data.length > 0) ? data[0] : {
      interactions_count: 0,
      token_usage: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost_estimate: 0
    };
    
    // Get document and webpage counts
    // For now we'll use the activity table or default to 0
    const documentCount = assistantData?.activity?.total_messages || 0;
    const webpageCount = 0; // This would need to be tracked separately
    
    return {
      messages: {
        used: usageData.interactions_count,
        limit: limits.max_messages,
        remaining: Math.max(0, limits.max_messages - usageData.interactions_count)
      },
      documents: {
        used: documentCount,
        limit: limits.max_documents,
        remaining: Math.max(0, limits.max_documents - documentCount)
      },
      webpages: {
        used: webpageCount,
        limit: limits.max_webpages,
        remaining: Math.max(0, limits.max_webpages - webpageCount)
      },
      tokens: {
        used: usageData.token_usage,
        limit: limits.max_tokens,
        remaining: Math.max(0, limits.max_tokens - usageData.token_usage)
      },
      lastReset: startDateStr
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    // Return default values on error
    return {
      messages: { used: 0, limit: 0, remaining: 0 },
      documents: { used: 0, limit: 0, remaining: 0 },
      webpages: { used: 0, limit: 0, remaining: 0 },
      tokens: { used: 0, limit: 0, remaining: 0 },
      lastReset: new Date().toISOString()
    };
  }
}

/**
 * Track usage for an assistant
 */
export async function trackUsage(
  assistantId: string, 
  type: UsageType, 
  amount: number = 1
): Promise<boolean> {
  try {
    // Update appropriate counters based on usage type
    switch (type) {
      case UsageType.MESSAGE_RECEIVED:
      case UsageType.MESSAGE_SENT:
        return await incrementMessageCount(assistantId, amount);
      
      case UsageType.TOKEN_USAGE:
        return await incrementTokenCount(assistantId, amount);
        
      default:
        return true; // Other types not yet implemented
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
    return false;
  }
}

// Helper for incrementing message count
async function incrementMessageCount(assistantId: string, amount: number = 1): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const assistantData = await getAssistantData(assistantId);
    
    if (!assistantData) {
      console.error('Assistant not found:', assistantId);
      return false;
    }
    
    const currentCount = assistantData.activity?.total_messages || 0;
    const newCount = currentCount + amount;
    
    return await updateAssistantData(assistantId, {
      activity: {
        total_messages: newCount,
        last_used_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return false;
  }
}

// Helper for incrementing token count
async function incrementTokenCount(assistantId: string, amount: number = 1): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const assistantData = await getAssistantData(assistantId);
    
    if (!assistantData) {
      console.error('Assistant not found:', assistantId);
      return false;
    }
    
    const currentCount = assistantData.activity?.total_tokens || 0;
    const newCount = currentCount + amount;
    
    return await updateAssistantData(assistantId, {
      activity: {
        total_tokens: newCount,
        last_used_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error incrementing token count:', error);
    return false;
  }
}

/**
 * Check if a usage limit has been reached
 */
export async function isLimitReached(assistantId: string, type: UsageType): Promise<boolean> {
  const result = await checkUsageLimits(assistantId, type);
  return result.hasReachedLimit;
}

/**
 * Get assistant usage statistics - compatibility with older API
 */
export async function getAssistantUsageStats(assistantId: string): Promise<UsageStatsResult> {
  return getUsageStats(assistantId);
}