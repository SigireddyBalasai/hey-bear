'use cache';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


import type { Database } from '@/types/db.types';
import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server-admin';

interface UserMetadata {
  full_name?: string;
  name?: string;
  stripe_customer_id?: string;
  [key: string]: unknown;
}

type Interaction = Database['public']['Tables']['interactions']['Row'];
type Assistant = Database['public']['Tables']['assistants']['Row'];

interface UserUsage {
  interactions_used: number;
  assistants_used: number;
  token_usage: number;
  cost_estimate: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  max_assistants: number;
  max_interactions: number;
  created_at: string;
  updated_at: string;
}

interface ExtendedUser {
  id: string;
  auth_user_id: string;
  email: string | undefined;
  full_name: string | undefined;
  last_sign_in: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  stripe_customer_id: string | null;
  plan: Plan;
  userusage: UserUsage;
}

// Cached function to fetch all admin users data
async function fetchAllUsersData(): Promise<ExtendedUser[]> {
  'use cache';

  const supabase: SupabaseClient<Database> = await createClient();
  const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();

  if (authUsersError) {
    console.error('Error fetching auth users:', authUsersError);
    throw new Error('Failed to fetch users');
  }

  if (!authUsersData?.users || authUsersData.users.length === 0) {
    return [];
  }

  // Get usage data for all users
  const userIds: string[] = authUsersData.users.map((user: User) => user.id);

  const { data: usageData, error: usageError } = await supabase
    .from('interactions')
    .select('*')
    .in('user_id', userIds);

  if (usageError) {
    console.error('Error fetching usage data:', usageError);
  }

  // Get assistant counts for each user
  const { data: assistantsData, error: assistantsError } = await supabase
    .from('assistants')
    .select('*')
    .in('user_id', userIds);

  if (assistantsError) {
    console.error('Error fetching assistants data:', assistantsError);
  }

  // Process and combine data
  const extendedUsers: ExtendedUser[] = authUsersData.users.map((authUser: User) => {
    // Calculate usage stats for this user
    const userUsageData: Interaction[] =
      (usageData as Interaction[])?.filter((usage: Interaction) => usage.user_id === authUser.id) ||
      [];
    const userAssistants: Assistant[] =
      (assistantsData as Assistant[])?.filter(
        (assistant: Assistant) => assistant.user_id === authUser.id
      ) || [];

    const userusage: UserUsage = {
      interactions_used: userUsageData.length,
      assistants_used: userAssistants.length,
      token_usage: userUsageData.reduce(
        (sum: number, usage: Interaction) => sum + (usage.token_usage || 0),
        0
      ),
      cost_estimate: userUsageData.reduce(
        (sum: number, usage: Interaction) => sum + (usage.cost_estimate || 0),
        0
      ),
    };

    // For now, we'll use a basic plan structure since plan data structure isn't clear
    const plan: Plan = {
      id: 'free',
      name: 'Free',
      description: 'Free plan',
      max_assistants: 5,
      max_interactions: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Safely access user metadata with proper type checking
    const userMetadata: UserMetadata | undefined = authUser.user_metadata as
      | UserMetadata
      | undefined;
    const fullName: string | undefined = userMetadata?.full_name || userMetadata?.name || undefined;

    return {
      id: authUser.id,
      auth_user_id: authUser.id,
      email: authUser.email,
      full_name: fullName,
      last_sign_in: authUser.last_sign_in_at || null,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at,
      is_admin: false,
      stripe_customer_id: (userMetadata?.stripe_customer_id as string) || null,
      plan,
      userusage,
    };
  });

  return extendedUsers;
}

export const GET = requireAdmin(
  async (): Promise<NextResponse<ExtendedUser[] | { error: string }>> => {
    try {
      // Use React's cache to reduce database load
      const users = await fetchAllUsersData();

      return NextResponse.json(users);
    } catch (error: unknown) {
      console.error('Error in admin users API:', error);

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
