/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */
'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { User } from '@supabase/supabase-js';

import type { UseAdminAuthResult } from '@/types/auth.types';
import { showWarning } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side authentication hooks
 * Uses client-side Supabase for browser components
 */

/**
 * Client-side admin authentication hook
 * Uses client-side Supabase for admin checking
 */
export function useAdminAuth(): UseAdminAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        const supabase = createClient();

        // Handle case where client is null during build
        if (!supabase) {
          setIsLoading(false);
          return;
        }

        // Get authenticated user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error('User not authenticated:', authError);
          router.push('/sign-in');
          return;
        }

        setUser(authUser);

        // Check admin status
        const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');

        if (adminError) {
          console.error('Error checking admin status:', adminError);
          showWarning('Access Error', 'Unable to verify admin permissions');
          router.push('/');
          return;
        }

        const userIsAdmin = Boolean(adminCheck);

        if (!userIsAdmin) {
          showWarning('Access Denied', "You don't have permission to access the admin dashboard");
          setIsAdmin(false);
          router.push('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    void checkAdminStatus();
  }, [router]);

  return { user, isAdmin, isLoading };
}

/**
 * Client-side basic authentication hook
 * Uses client-side Supabase for user checking
 */
export function useAuth(): { user: User | null; isLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);

        const supabase = createClient();

        // Get authenticated user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error('User not authenticated:', authError);
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(authUser);
      } catch (error) {
        console.error('Error in checking auth status:', error);
        router.push('/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, [router]);

  return { user, isLoading };
}
