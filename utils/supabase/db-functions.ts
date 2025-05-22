import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/db.types';

export async function createUnpaidAssistant(
  supabase: SupabaseClient<Database>,
  args: Database['public']['Functions']['create_unpaid_assistant']['Args']
) {
  const { data, error } = await supabase.rpc('create_unpaid_assistant', args);
  return { data, error };
}