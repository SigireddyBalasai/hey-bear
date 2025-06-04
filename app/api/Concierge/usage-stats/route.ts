import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/utils/supabase/server';
import { getUsageAndLimits } from '@/utils/usage-limits';

export async function GET(req: NextRequest) {
  try {
    // Extract the assistant ID from the query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Missing required parameter: assistantId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user has access to this assistant
    const { data: assistantData, error: assistantError } = await supabase

      .from('assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();

    if (assistantError) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'Error fetching assistant data' }, { status: 500 });
    }

    // Get the application-specific user ID from the users.users table.
    // user.id from auth.getUser() is the auth.users.id (UUID).
    // We need to find the record in the 'users' table within the 'users' schema
    // that matches this auth_user_id and get its 'id' column.
    const { data: appUserData, error: appUserError } = await supabase
      // Target the 'users' schema
      .from('users') // Target the 'users' table within the 'users' schema
      .select('id') // Select the application-specific 'id'
      .eq('auth_user_id', user.id) // Match against the auth user's ID
      .single();

    if (appUserError) {
      console.error('Error fetching application user from users.users:', appUserError);
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }

    // Check if the user owns this assistant.
    // assistantData.user_id (from assistants.assistants) should match appUserData.id (from users.users).
    if (assistantData.user_id !== appUserData.id) {
      return NextResponse.json(
        { error: 'You do not have access to this assistant' },
        { status: 403 }
      );
    }

    // Get the usage statistics for this assistant
    const usageStats = await getUsageAndLimits(assistantId);

    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
