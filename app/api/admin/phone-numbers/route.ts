import { NextResponse } from 'next/server';

import { requireAdmin } from '@/utils/admin';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    await requireAdmin(supabase);

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
