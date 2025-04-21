import { createClient } from '@/utils/supabase/server';
import { isSubscriptionActive } from '@/lib/stripe';

interface Subscription {
  status?: string;
  plan?: string;
}

/**
 * Check if the given assistant has an active subscription
 */
export async function checkAssistantSubscription(assistantId: string) {
  try {
    const supabase = await createClient();
    
    // Fetch the assistant with subscription info
    const { data: assistant, error } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (error || !assistant) {
      console.error('Error fetching assistant:', error);
      return { isActive: false, error: 'Assistant not found' };
    }
    
    // Use the helper to check if the subscription is active
    const subscription = typeof assistant.params === 'object' && assistant.params 
      ? (assistant.params as Record<string, any>).subscription as Subscription 
      : undefined;
    const active = isSubscriptionActive(subscription);
    
    if (!active) {
      return { 
        isActive: false, 
        error: 'Subscription inactive', 
        status: subscription?.status,
        plan: subscription?.plan
      };
    }
    
    return { isActive: true };
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isActive: false, error: 'Failed to check subscription' };
  }
}