import { createClient } from '@/utils/supabase/server';

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema('users')
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return Boolean(data.is_admin);
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const isUserAdmin = await isAdmin(userId);
  if (!isUserAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function getAdminSettings(): Promise<Record<string, unknown>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema('public')
      .from('usage_statistics')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAdminSettings:', error);
    throw error;
  }
}

export async function updateAdminSettings(settings: Record<string, unknown>): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .schema('public')
      .from('usage_statistics')
      .update(settings)
      .eq('id', '1'); // Assuming single row for settings

    if (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateAdminSettings:', error);
    throw error;
  }
}

export async function getSystemStats(): Promise<{
  totalUsers: number;
  activeAssistants: number;
  totalInteractions: number;
  totalTokens: number;
}> {
  try {
    const supabase = await createClient();

    // Get total users
    const { count: userCount } = await supabase
      .schema('users')
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active assistants
    const { count: assistantCount } = await supabase
      .schema('assistants')
      .from('assistants')
      .select('*', { count: 'exact', head: true })
      .eq('pending', false);

    // Get interaction stats
    const { data: stats } = await supabase
      .schema('analytics')
      .from('interactions')
      .select('token_usage');

    const totalInteractions = (stats ?? []).length;
    const totalTokens = (stats ?? []).reduce((sum, curr) => sum + (curr.token_usage ?? 0), 0);

    return {
      totalUsers: userCount ?? 0,
      activeAssistants: assistantCount ?? 0,
      totalInteractions,
      totalTokens,
    };
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    throw error;
  }
}
