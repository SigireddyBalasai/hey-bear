import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all available (unassigned) phone numbers
    const { data: phoneNumbers, error } = await supabase
      .from('phone_numbers')
      .select('id, phone_number, country, capabilities, status, created_at')
      .eq('is_assigned', false)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch available phone numbers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: phoneNumbers ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch phone numbers' },
      { status: 500 }
    );
  }
}
