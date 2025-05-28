import { createClient } from '@/utils/supabase/server';
import type { Tables } from '@/lib/db.types';

type _UsageLimits = Tables<{ schema: 'assistants' }, 'assistant_usage_limits'>;
type AssistantActivity = Tables<{ schema: 'assistants' }, 'assistant_activity'>;

interface UsageLimit {
  type: string;
  current: number;
  limit: number;
  percentage: number;
}

export enum UsageType {
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  DOCUMENT_ADDED = 'document_added',
  WEBPAGE_ADDED = 'webpage_added'
}

// Track usage for an assistant
export async function trackUsage(assistantId: string, type: UsageType): Promise<void> {
  try {
    const supabase = await createClient();
    const updateData: Partial<AssistantActivity> = {};

    switch (type) {
      case UsageType.MESSAGE_RECEIVED:
      case UsageType.MESSAGE_SENT:
        updateData.total_messages = 1; // Will be added to current value due to increment
        updateData.last_message_at = new Date().toISOString();
        break;
      case UsageType.DOCUMENT_ADDED:
        updateData.total_documents = 1;
        break;
      case UsageType.WEBPAGE_ADDED:
        updateData.total_webpages = 1;
        break;
    }

    updateData.last_used_at = new Date().toISOString();

    const { error } = await supabase
      .schema('assistants')
      .from('assistant_activity')
      .upsert({
        assistant_id: assistantId,
        ...updateData
      }, {
        onConflict: 'assistant_id',
        count: 'exact'
      });

    if (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in trackUsage:', error);
    throw error;
  }
}

// Check if usage limit has been reached
export async function isLimitReached(assistantId: string, type: UsageType): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Get current usage
    const { data: activity, error: activityError } = await supabase
      .schema('assistants')
      .from('assistant_activity')
      .select('*')
      .eq('assistant_id', assistantId)
      .single();

    if (activityError) {
      console.error('Error checking activity:', activityError);
      return false; // Default to allowing usage if we can't check
    }

    // Get limits
    const { data: limits, error: limitsError } = await supabase
      .schema('assistants')
      .from('assistant_usage_limits')
      .select('*')
      .eq('assistant_id', assistantId)
      .single();

    if (limitsError) {
      console.error('Error checking limits:', limitsError);
      return false; // Default to allowing usage if we can't check
    }

    // If no limits set, allow usage
    if (!limits) return false;

    // Check specific limit type
    switch (type) {
      case UsageType.MESSAGE_RECEIVED:
      case UsageType.MESSAGE_SENT:
        return (activity?.total_messages ?? 0) >= (limits.message_limit ?? Infinity);
      case UsageType.DOCUMENT_ADDED:
        return (activity?.total_documents ?? 0) >= (limits.document_limit ?? Infinity);
      case UsageType.WEBPAGE_ADDED:
        return (activity?.total_webpages ?? 0) >= (limits.webpage_limit ?? Infinity);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error in isLimitReached:', error);
    return false; // Default to allowing usage if there's an error
  }
}

// Get current usage and limits
export async function getUsageAndLimits(assistantId: string): Promise<UsageLimit[]> {
  try {
    const supabase = await createClient();
    
    // Get current usage
    const { data: activity, error: activityError } = await supabase
      .schema('assistants')
      .from('assistant_activity')
      .select('*')
      .eq('assistant_id', assistantId)
      .single();

    if (activityError) {
      console.error('Error getting activity:', activityError);
      throw activityError;
    }

    // Get limits
    const { data: limits, error: limitsError } = await supabase
      .schema('assistants')
      .from('assistant_usage_limits')
      .select('*')
      .eq('assistant_id', assistantId)
      .single();

    if (limitsError) {
      console.error('Error getting limits:', limitsError);
      throw limitsError;
    }

    return [
      {
        type: UsageType.MESSAGE_SENT,
        current: activity?.total_messages ?? 0,
        limit: limits?.message_limit ?? Infinity,
        percentage: Math.round(((activity?.total_messages ?? 0) / (limits?.message_limit ?? Infinity)) * 100)
      },
      {
        type: UsageType.DOCUMENT_ADDED,
        current: activity?.total_documents ?? 0,
        limit: limits?.document_limit ?? Infinity,
        percentage: Math.round(((activity?.total_documents ?? 0) / (limits?.document_limit ?? Infinity)) * 100)
      },
      {
        type: UsageType.WEBPAGE_ADDED,
        current: activity?.total_webpages ?? 0,
        limit: limits?.webpage_limit ?? Infinity,
        percentage: Math.round(((activity?.total_webpages ?? 0) / (limits?.webpage_limit ?? Infinity)) * 100)
      }
    ];
  } catch (error) {
    console.error('Error in getUsageAndLimits:', error);
    throw error;
  }
}
