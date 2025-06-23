import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Use Supabase RPC to check for admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { data: phoneNumbers, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: phoneNumbers,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch phone numbers' },
      { status: 500 }
    );
  }
}
