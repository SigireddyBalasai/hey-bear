import { NextResponse } from 'next/server';

import type { AuthResult } from '@/types/auth.types';
import { createClient } from '@/utils/supabase/server';

/**
 * Core authentication function used by all auth utilities
 * Handles both user and admin authentication in one place
 */
export async function authenticate(requireAdmin = false): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError !== null) {
      return {
        success: false,
        user: null,
        isAdmin: false,
        error: 'Authentication error',
        response: NextResponse.json(
          { error: 'Unauthorized: Authentication error', details: authError.message },
          { status: 401 }
        ),
      };
    }

    if (user === null) {
      return {
        success: false,
        user: null,
        isAdmin: false,
        error: 'No user found',
        response: NextResponse.json({ error: 'Unauthorized: No user found' }, { status: 401 }),
      };
    }

    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');

    if (adminError !== null) {
      console.error('Error checking admin status:', adminError);

      return {
        success: false,
        user,
        isAdmin: false,
        error: 'Admin status check failed',
        response: NextResponse.json(
          { error: 'Internal server error: Admin status check failed' },
          { status: 500 }
        ),
      };
    }

    const isAdmin = Boolean(adminCheck);

    if (requireAdmin && !isAdmin) {
      return {
        success: false,
        user,
        isAdmin: false,
        error: 'Admin access required',
        response: NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user,
      isAdmin,
    };
  } catch (error) {
    console.error('Authentication error:', error);

    return {
      success: false,
      user: null,
      isAdmin: false,
      error: 'Internal authentication error',
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    };
  }
}
