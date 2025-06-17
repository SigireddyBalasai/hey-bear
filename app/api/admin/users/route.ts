import { NextResponse } from 'next/server';

import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Force runtime rendering to prevent build-time Supabase initialization
export const runtime = 'nodejs';

/**
 * API route for fetching all users with their usage data
 */
export const GET = requireAdmin(async () => {
  try {
    const supabase = await createClient();

    // Get all auth users
    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!authUsersData?.users || authUsersData.users.length === 0) {
      return NextResponse.json([]);
    }

    // Get usage data for all users
    const userIds = authUsersData.users.map(user => user.id);

    const { data: usageData, error: usageError } = await supabase
      .from('interactions')
      .select(
        `
        user_id,
        token_usage,
        input_tokens,
        output_tokens,
        cost_estimate
      `
      )
      .in('user_id', userIds);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
    }

    // Get assistant counts for each user
    const { data: assistantsData, error: assistantsError } = await supabase
      .from('assistants')
      .select('user_id')
      .in('user_id', userIds);

    if (assistantsError) {
      console.error('Error fetching assistants data:', assistantsError);
    }

    // Process and combine data
    const extendedUsers = authUsersData.users.map(authUser => {
      // Calculate usage stats for this user
      const userUsageData = usageData?.filter(usage => usage.user_id === authUser.id) || [];
      const userAssistants =
        assistantsData?.filter(assistant => assistant.user_id === authUser.id) || [];

      const userusage = {
        interactions_used: userUsageData.length,
        assistants_used: userAssistants.length,
        token_usage: userUsageData.reduce((sum, usage) => sum + (usage.token_usage || 0), 0),
        cost_estimate: userUsageData.reduce((sum, usage) => sum + (usage.cost_estimate || 0), 0),
      };

      // For now, we'll use a basic plan structure since plan data structure isn't clear
      const plan = {
        id: 'free',
        name: 'Free',
        description: 'Free plan',
        max_assistants: 5,
        max_interactions: 1000,
      };

      // Safely access user metadata with proper type checking
      const userMetadata = authUser.user_metadata as Record<string, unknown> | undefined;
      const fullName =
        typeof userMetadata?.full_name === 'string'
          ? userMetadata.full_name
          : typeof userMetadata?.name === 'string'
            ? userMetadata.name
            : undefined;

      return {
        id: authUser.id,
        auth_user_id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        last_sign_in: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        is_admin: Boolean(userMetadata?.is_admin),
        stripe_customer_id:
          typeof userMetadata?.stripe_customer_id === 'string'
            ? userMetadata.stripe_customer_id
            : null,
        plan,
        userusage,
      };
    });

    return NextResponse.json(extendedUsers);
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
