/**
 * Custom hooks for authentication and admin checking
 * Uses auth-utils.ts functions for consistent authentication logic
 */
import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { User } from '@supabase/supabase-js';

import { getAuthenticatedUser, requireAdminAuthentication } from '@/utils/auth-utils';
import { showWarning } from '@/utils/error-handling';
import { UseAdminAuthResult } from '@/types/app.types';

/**
 * Custom hook for admin authentication check
 * Uses auth-utils functions for database role checking
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

        // Use auth-utils function for consistent admin checking
        const { user, isAuthenticated, isAdmin: userIsAdmin } = await requireAdminAuthentication();

        if (!isAuthenticated || !user) {
          console.error('User not authenticated');
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(user);

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
 * Custom hook for basic user authentication check
 * Uses auth-utils function for consistent user checking
 */
export function useAuth(): { user: User | null; isLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);

        // Use auth-utils function for consistent user checking
        const authenticatedUser = await getAuthenticatedUser();

        if (!authenticatedUser) {
          console.error('User not authenticated');
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(authenticatedUser);
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
