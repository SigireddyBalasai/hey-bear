import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/client';

export type AdminNotification = Database['public']['Tables']['notifications']['Row'];

export async function getAdminNotifications(userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase

      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data as AdminNotification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase

      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function createNotification(
  notification: Omit<AdminNotification, 'id' | 'created_at'>
) {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('notifications').insert([
      {
        ...notification,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}
