import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

/**
 *       const plan = {
        max_assistants: 5,
        max_interactions: 1000,
      };

      const userMetadata = authUser?.user_metadata as { full_name?: string; name?: string } | undefined;

      return {
        ...user,
        email: authUser?.email,
        full_name: userMetadata?.full_name || userMetadata?.name,
        last_sign_in: authUser?.last_sign_in_at,
        plan,
        userusage,
      }; fetching all users with their usage data
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication and admin permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: userData, error: userDataError } = await supabase

      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();

    if (userDataError || !userData.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all users from users schema
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!usersData || usersData.length === 0) {
      return NextResponse.json([]);
    }

    // Get auth user data to get email and other details
    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
    }

    // Get usage data for all users
    const userIds = usersData
      .map(user => user.auth_user_id)
      .filter((id): id is string => id !== null);

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
    const extendedUsers = usersData.map(user => {
      const authUser = authUsersData?.users?.find(au => au.id === user.auth_user_id);

      // Calculate usage stats for this user
      const userUsageData = usageData?.filter(usage => usage.user_id === user.auth_user_id) || [];
      const userAssistants =
        assistantsData?.filter(assistant => assistant.user_id === user.auth_user_id) || [];

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
      const userMetadata = authUser?.user_metadata as Record<string, unknown> | undefined;
      const fullName =
        typeof userMetadata?.full_name === 'string'
          ? userMetadata.full_name
          : typeof userMetadata?.name === 'string'
            ? userMetadata.name
            : undefined;

      return {
        ...user,
        email: authUser?.email,
        full_name: fullName,
        last_sign_in: authUser?.last_sign_in_at,
        plan,
        userusage,
      };
    });

    return NextResponse.json(extendedUsers);
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
