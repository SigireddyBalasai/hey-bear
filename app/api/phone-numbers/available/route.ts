import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET(_req: Request) {
  try {
    const supabase = await createClient();

    // Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all unassigned phone numbers
    const { data: numbers, error } = await supabase
      .from('phone_numbers')
      .select('id, phone_number')
      .eq('is_assigned', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching available phone numbers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available phone numbers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ numbers });
  } catch (error: unknown) {
    console.error('Error fetching available phone numbers:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
