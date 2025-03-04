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
