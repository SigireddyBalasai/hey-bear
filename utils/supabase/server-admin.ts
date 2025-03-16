import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/db.types';

/**
 * Creates a Supabase client with admin privileges using the service role key.
 * Use this for server-side operations that need to bypass RLS policies,
 * such as webhooks, cron jobs, or admin functions.
 */
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials for service client');
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};
