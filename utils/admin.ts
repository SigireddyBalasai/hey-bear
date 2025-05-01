import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks if a user is an admin
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns Object with isAdmin boolean and error if any
 */
export async function checkIsAdmin(supabase: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("is_admin")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error) {
      return { isAdmin: false, error };
    }
    
    return { isAdmin: data?.is_admin || false, error: null };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { isAdmin: false, error };
  }
}

/**
 * Get admin dashboard summary data
 * @param supabase - Supabase client instance
 * @returns Dashboard summary data object
 */
export async function getDashboardSummary(supabase: SupabaseClient) {
  try {
    // Get total users count
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });
    
    if (usersError) throw new Error(`Failed to fetch user count: ${usersError.message}`);
    const userCount = usersData?.length || 0;
    
    // Get total assistants count
    const { data: assistantsData, error: assistantsError } = await supabase
      .from('assistants')
      .select('id', { count: 'exact' });
    
    if (assistantsError) throw new Error(`Failed to fetch assistant count: ${assistantsError.message}`);
    const assistantCount = assistantsData?.length || 0;
    
    // Get active subscription count
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'active');
    
    if (subscriptionsError) throw new Error(`Failed to fetch subscription count: ${subscriptionsError.message}`);
    const activeSubscriptionCount = subscriptionsData?.length || 0;
    
    // Get total interactions count
    const { data: interactionsData, error: interactionsError } = await supabase
      .from('interactions')
      .select('id', { count: 'exact' });
    
    if (interactionsError) throw new Error(`Failed to fetch interaction count: ${interactionsError.message}`);
    const interactionCount = interactionsData?.length || 0;
    
    return {
      userCount,
      assistantCount,
      activeSubscriptionCount,
      interactionCount,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting dashboard summary:", error);
    throw error;
  }
}
