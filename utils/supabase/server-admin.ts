import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/db.types';

/**
 * Creates a Supabase client with public anon key but without requiring 
 * authentication. Used for webhook endpoints where user session isn't available.
 */
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false
      }
    }
  );
};
