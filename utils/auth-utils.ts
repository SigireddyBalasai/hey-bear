import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';


import type { AuthContext, AuthResult } from '@/types/auth.types';
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

    if (adminError) {
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

/**
 * Higher-order function for API routes that require user authentication
 * Usage: export const GET = requireAuth(async (context, req) => { ... })
 */
export function requireAuth(
  handler: (context: AuthContext, req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticate(false);

    if (!authResult.success) {
      if (!authResult.response) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }

      return authResult.response;
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const context: AuthContext = {
      user: authResult.user,
      isAdmin: authResult.isAdmin,
    };

    return handler(context, req);
  };
}

/**
 * Higher-order function for API routes that require admin authentication
 * Usage: export const GET = requireAdmin(async (context, req) => { ... })
 */
export function requireAdmin(
  handler: (context: AuthContext, req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticate(true);

    if (!authResult.success) {
      if (!authResult.response) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }

      return authResult.response;
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const context: AuthContext = {
      user: authResult.user,
      isAdmin: authResult.isAdmin,
    };

    return handler(context, req);
  };
}

/**
 * Utility function for non-HOF usage in API routes
 * Returns auth context or throws with appropriate response
 */
export async function getAuthContext(requireAdmin = false): Promise<AuthContext> {
  const authResult = await authenticate(requireAdmin);

  if (!authResult.success) {
    if (!authResult.response) {
      throw NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    throw authResult.response;
  }

  if (!authResult.user) {
    throw NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  return {
    user: authResult.user,
    isAdmin: authResult.isAdmin,
  };
}

/**
 * Check if user is admin using database role (server-side utility function)
 * This function uses server-side Supabase client
 */
export async function isUserAdmin(user: User | null): Promise<boolean> {
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
 * Legacy compatibility - maintains existing function names
 */
export const authenticateUser = () => authenticate(false);
export const authenticateAdmin = () => authenticate(true);
export const withAuthHandler = requireAuth;
export const withAdminHandler = requireAdmin;
