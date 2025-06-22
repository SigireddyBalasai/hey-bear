import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available phone numbers
    const { data: phoneNumbers, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('is_assigned', false)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch phone numbers: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: phoneNumbers.map(phone => ({
        id: phone.id,
        phoneNumber: phone.phone_number,
        country: phone.country,
        capabilities: phone.capabilities,
        createdAt: phone.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch available numbers' },
      { status: 500 }
    );
  }
}
