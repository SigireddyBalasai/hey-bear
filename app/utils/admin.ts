import { SupabaseClient } from '@supabase/supabase-js';

export async function checkIsAdmin(supabase: SupabaseClient, userId: string) {
  try {
    console.log('Checking admin status for:', userId);
    
    // Need to check against auth_user_id, not user.id
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', userId)
      .single();
      
    if (error) {
      console.error('Admin check error:', error);
      return { isAdmin: false, error };
    }
    
    console.log('Admin check result:', userData);
    return { isAdmin: !!userData?.is_admin, error: null };
  } catch (error) {
    console.error('Exception in checkIsAdmin:', error);
    return { isAdmin: false, error };
  }
}
