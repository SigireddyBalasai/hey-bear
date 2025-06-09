"use server";

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/db.types';

/**
 * Creates a Supabase client with service role key for admin operations.
 * This client bypasses Row Level Security (RLS) and should only be used
 * in secure server environments for admin operations, webhooks, etc.
 */
export const createClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};