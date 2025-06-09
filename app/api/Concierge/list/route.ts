import { NextResponse } from 'next/server';

import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Pinecone related imports like getPineconeClient are removed.

export const GET = requireAuth(async context => {
  try {
    const supabase = await createClient();
    const userId = context.user.id;

    // 3. Query `assistant_detail_view`
    // Use auth user ID to query the view
    const { data: assistants, error: assistantsError } = await supabase
      .from('assistant_detail_view')
      .select('*')
      .eq('user_id', userId); // Filter by the auth user ID

    if (assistantsError) {
      console.error(
        'Error fetching assistants from assistant_detail_view for user ID:',
        userId,
        assistantsError
      );
      return NextResponse.json({ error: 'Failed to retrieve assistants' }, { status: 500 });
    }

    // 4. Return Assistants
    // If successful, return the assistants data. assistants will be an array.
    // If no assistants are found, it will be an empty array, which is handled correctly.
    return NextResponse.json({ assistants: assistants ?? [] });
  } catch (error) {
    // General catch block for any other unexpected errors
    console.error('Unexpected error in GET /api/Concierge/list:', error);
    // Check if error is an instance of Error to access message property safely
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: errorMessage },
      { status: 500 }
    );
  }
});
