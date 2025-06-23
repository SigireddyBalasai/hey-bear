// Authentication-related interfaces and types
import type { NextResponse } from 'next/server';

import type { User } from '@supabase/supabase-js';

// Auth context interface
export interface AuthContext {
  user: User;
  isAdmin: boolean;
}

// Auth result interface
export interface AuthResult {
  success: boolean;
  user: User | null;
  isAdmin: boolean;
  error?: string;
  response?: NextResponse;
}

// Admin auth hook result
export interface UseAdminAuthResult {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

// Admin header props
export interface AdminHeaderProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

// User data interface
export interface UserData {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  last_sign_in: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'pending';
  subscription_plan: string;
  last_active: string;
  total_interactions: number;
  total_tokens: number;
  cost_estimate: number;
}

// User state interface for UI components
export interface UserState {
  id: string;
  user_metadata: {
    name: string;
    avatar_url: string;
  };
}
