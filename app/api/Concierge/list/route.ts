import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
// Pinecone related imports like getPineconeClient are removed.

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error in /api/Concierge/list:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Application User ID from public.users table
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('id') // Select the application-specific user ID
      .eq('auth_user_id', user.id) // Match against the authenticated user's ID
      .single();

    if (userFetchError || !userData) {
      console.error('Error fetching user data for auth user ID:', user.id, userFetchError);
      return NextResponse.json({ error: 'Failed to fetch user data or user record not found' }, { status: 500 });
    }

    // 3. Query `assistant_detail_view`
    // Use userData.id (the application user ID) to query the view
    const { data: assistants, error: assistantsError } = await supabase
      .from('assistant_detail_view')
      .select('*')
      .eq('user_id', userData.id); // Filter by the application user ID

    if (assistantsError) {
      console.error('Error fetching assistants from assistant_detail_view for user ID:', userData.id, assistantsError);
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
    return NextResponse.json({ error: 'An unexpected error occurred', details: errorMessage }, { status: 500 });
  }
}
