import { createClient } from '@/utils/supabase/server';

export async function getPhoneNumbers() {
  try {
    const supabase = await createClient();

    // Ensure user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const { data: phoneNumbers, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: phoneNumbers };
  } catch {
    return { success: false, error: 'Failed to fetch phone numbers' };
  }
}
