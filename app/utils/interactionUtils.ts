import { createClient } from '@/utils/supabase/client';

/**
 * Gets the internal user ID from the auth user ID
 * This is necessary because our database schema uses user_id but the auth system uses auth_user_id
 */
export async function getUserIdFromAuthId(authUserId: string): Promise<string | null> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();
      
    if (error || !data) {
      console.error('Error getting user ID from auth ID:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Exception getting user ID from auth ID:', error);
    return null;
  }
}

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
  isError: boolean = false
) {
  const supabase = await createClient();
  
  try {
    // First get the internal user ID from the auth user ID
    const userId = await getUserIdFromAuthId(authUserId);
    
    if (!userId) {
      throw new Error(`Could not find user with auth_user_id: ${authUserId}`);
    }
    
    // Now insert the interaction with the correct user_id
    const { error } = await supabase.from('interactions').insert({
      user_id: userId,
      assistant_id: assistantId,
      chat,
      request,
      response,
      token_usage: tokenUsage,
      cost_estimate: costEstimate,
      duration,
      is_error: isError
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving interaction to Supabase:', error);
    return false;
  }
}
