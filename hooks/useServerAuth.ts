/**
 * Server-side authentication utilities
 * Uses server-side Supabase for API routes and server components
 */
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/server';

/**
 * Server-side authentication check
 * Returns user data if authenticated, null otherwise
 */
export async function getServerAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Server-side admin status check
 * Returns admin status for the given user
 */
export async function isServerUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  try {
    const supabase = await createClient();

    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return false;
    }

    return Boolean(adminCheck);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Server-side authentication check for components
 */
export async function requireServerAuthentication(): Promise<{
  user: User | null;
  isAuthenticated: boolean;
}> {
  const user = await getServerAuthenticatedUser();
  return {
    user,
    isAuthenticated: user !== null,
  };
}

/**
 * Server-side admin authentication check for components
 */
export async function requireServerAdminAuthentication(): Promise<{
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}> {
  const user = await getServerAuthenticatedUser();
  const isAdmin = await isServerUserAdmin(user);

  return {
    user,
    isAuthenticated: user !== null,
    isAdmin,
  };
}
