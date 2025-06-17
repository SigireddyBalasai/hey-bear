"use client";
import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/db.types';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // During build time, environment variables might not be available
  // Return a mock client or handle gracefully
  if (!supabaseUrl || !supabaseAnonKey) {
    // In build time, we don't have access to env vars
    throw new Error('Missing Supabase environment variables');
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
};
