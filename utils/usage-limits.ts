import { createClient } from '@/utils/supabase/server';
import { isSubscriptionActive } from '@/lib/stripe';

// Define the plan limits for personal and business subscriptions
export const PLAN_LIMITS = {
  PERSONAL: {
    MESSAGES_MONTHLY: 300, // 300 messages/month (sent and received)
    DOCUMENTS: 5,         // 5 documents
    WEBPAGES: 5           // 5 webpages crawled
  },
  BUSINESS: {
    MESSAGES_MONTHLY: 2000, // 2,000 messages/month (sent and received)
    DOCUMENTS: 25,          // 25 documents
    WEBPAGES: 25            // 25 webpages crawled
  }
};

// Define the types of usage we're tracking
export enum UsageType {
  MESSAGE_RECEIVED = 'messages_received',
  MESSAGE_SENT = 'messages_sent',
  DOCUMENT_ADDED = 'documents_count',
  WEBPAGE_CRAWLED = 'webpages_crawled'
}

/**
 * Determines the limit for a specific usage type based on the subscription plan
 */
export function getUsageLimit(usageType: UsageType, subscription: any): number {
  // Default to the personal plan if no subscription is available
  const plan = (subscription as { plan?: string })?.plan?.toLowerCase() === 'business' ? 'BUSINESS' : 'PERSONAL';
  
  // Return the appropriate limit based on usage type
  switch (usageType) {
    case UsageType.MESSAGE_RECEIVED:
    case UsageType.MESSAGE_SENT:
      // For messages, we need to consider the combined limit for received and sent
      return PLAN_LIMITS[plan].MESSAGES_MONTHLY;
    
    case UsageType.DOCUMENT_ADDED:
      return PLAN_LIMITS[plan].DOCUMENTS;
    
    case UsageType.WEBPAGE_CRAWLED:
      return PLAN_LIMITS[plan].WEBPAGES;
    
    default:
      return 0;
  }
}

/**
 * Track usage for an assistant
 * @param assistantId - The ID of the assistant
 * @param usageType - The type of usage to track
 * @param increment - The amount to increment by (default: 1)
 * @returns true if the operation succeeded, false otherwise
 */
export async function trackUsage(
  assistantId: string,
  usageType: UsageType,
  increment: number = 1
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // First, check if the usage record exists and if we need to reset monthly counters
    const { data: currentUsage, error: fetchError } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('assistant_id', assistantId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching usage limits:', fetchError);
      
      // If the error is because the record doesn't exist, create a new one
      if (fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('usage_limits')
          .insert({ assistant_id: assistantId });
        
        if (insertError) {
          console.error('Error creating usage limits record:', insertError);
          return false;
        }
      } else {
        return false;
      }
    }
    
    // Check if we need to reset monthly counters (messages)
    // Only reset message counters as documents and webpages are absolute limits
    const shouldResetMonthly = currentUsage && isTimeToResetMonthly(currentUsage.last_reset);
    
    if (shouldResetMonthly && 
        (usageType === UsageType.MESSAGE_RECEIVED || usageType === UsageType.MESSAGE_SENT)) {
      // Reset monthly counters
      const { error: resetError } = await supabase
        .from('usage_limits')
        .update({
          messages_received: 0,
          messages_sent: 0,
          last_reset: new Date().toISOString()
        })
        .eq('assistant_id', assistantId);
      
      if (resetError) {
        console.error('Error resetting usage limits:', resetError);
        return false;
      }
    }
    
    // Increment the appropriate usage counter
    const { error: updateError } = await supabase
      .from('usage_limits')
      .update({
        [usageType]: (currentUsage?.[usageType] || 0) + increment
      })
      .eq('assistant_id', assistantId);
    
    if (updateError) {
      console.error('Error updating usage limits:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error tracking usage:', error);
    return false;
  }
}

/**
 * Check if the usage limit has been reached for a specific type
 * @param assistantId - The ID of the assistant
 * @param usageType - The type of usage to check
 * @returns true if the limit has been reached, false otherwise
 */
export async function isLimitReached(
  assistantId: string,
  usageType: UsageType
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get the current usage and the assistant details (for plan info)
    const [usageResponse, assistantResponse] = await Promise.all([
      supabase
        .from('usage_limits')
        .select('*')
        .eq('assistant_id', assistantId)
        .single(),
      
      supabase
        .from('assistants')
        .select('params')
        .eq('id', assistantId)
        .single()
    ]);
    
    if (usageResponse.error || assistantResponse.error) {
      console.error('Error fetching usage or assistant data:', 
        usageResponse.error || assistantResponse.error);
      
      // If we can't verify the limit, assume it's not reached to avoid blocking users
      return false;
    }
    
    const usage = usageResponse.data;
    const assistantParams = assistantResponse.data.params;
    
    // Extract the subscription info from the params
    const subscription = (typeof assistantParams === 'object' && 
                        assistantParams !== null && 
                        'subscription' in assistantParams) ? 
                        assistantParams.subscription : null;
    
    // For message limits, we need to check the combined total
    if (usageType === UsageType.MESSAGE_RECEIVED || usageType === UsageType.MESSAGE_SENT) {
      const totalMessages = (usage.messages_received || 0) + (usage.messages_sent || 0);
      const messageLimit = getUsageLimit(UsageType.MESSAGE_RECEIVED, subscription);
      return totalMessages >= messageLimit;
    }
    
    // For other usage types, compare directly against the limit
    const currentUsage = usage[usageType] || 0;
    const limit = getUsageLimit(usageType, subscription);
    
    return currentUsage >= limit;
  } catch (error) {
    console.error('Unexpected error checking usage limit:', error);
    // If we encounter an error, assume the limit is not reached to avoid blocking users
    return false;
  }
}

/**
 * Get the current usage statistics for an assistant
 */
export async function getAssistantUsageStats(assistantId: string) {
  try {
    const supabase = await createClient();
    
    // Get the current usage and the assistant details
    const [usageResponse, assistantResponse] = await Promise.all([
      supabase
        .from('usage_limits')
        .select('*')
        .eq('assistant_id', assistantId)
        .single(),
      
      supabase
        .from('assistants')
        .select('params')
        .eq('id', assistantId)
        .single()
    ]);
    
    if (usageResponse.error || assistantResponse.error) {
      console.error('Error fetching usage or assistant data for stats:', 
        usageResponse.error || assistantResponse.error);
      return null;
    }
    
    const usage = usageResponse.data;
    const assistantParams = assistantResponse.data.params;
    
    // Extract the subscription info from the params
    const subscription = (typeof assistantParams === 'object' && 
                        assistantParams !== null && 
                        'subscription' in assistantParams) ? 
                        assistantParams.subscription : null;
    
    // Add proper type checking before accessing plan property
    const planValue = typeof subscription === 'object' && 
                     subscription !== null && 
                     'plan' in subscription && 
                     typeof subscription.plan === 'string' ?
                     subscription.plan.toLowerCase() : '';
                     
    const plan = planValue === 'business' ? 'BUSINESS' : 'PERSONAL';
    
    return {
      messages: {
        used: (usage.messages_received || 0) + (usage.messages_sent || 0),
        limit: PLAN_LIMITS[plan].MESSAGES_MONTHLY,
        remaining: Math.max(0, PLAN_LIMITS[plan].MESSAGES_MONTHLY - 
          ((usage.messages_received || 0) + (usage.messages_sent || 0)))
      },
      documents: {
        used: usage.documents_count || 0,
        limit: PLAN_LIMITS[plan].DOCUMENTS,
        remaining: Math.max(0, PLAN_LIMITS[plan].DOCUMENTS - (usage.documents_count || 0))
      },
      webpages: {
        used: usage.webpages_crawled || 0,
        limit: PLAN_LIMITS[plan].WEBPAGES,
        remaining: Math.max(0, PLAN_LIMITS[plan].WEBPAGES - (usage.webpages_crawled || 0))
      },
      lastReset: usage.last_reset
    };
  } catch (error) {
    console.error('Unexpected error getting usage stats:', error);
    return null;
  }
}

/**
 * Check if it's time to reset monthly counters
 * @param lastReset The timestamp of the last reset
 * @returns true if a month has passed since the last reset
 */
function isTimeToResetMonthly(lastReset: string): boolean {
  // Parse the last reset date
  const resetDate = new Date(lastReset);
  const currentDate = new Date();
  
  // Check if we're in a different month and year
  return resetDate.getMonth() !== currentDate.getMonth() || 
         resetDate.getFullYear() !== currentDate.getFullYear();
}