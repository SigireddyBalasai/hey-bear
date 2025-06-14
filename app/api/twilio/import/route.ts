import { NextResponse } from 'next/server';

import type { ImportPhoneNumberRequest } from '@/types/api.types';
import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

export const POST = requireAdmin(async (context, req) => {
  try {
    const supabase = await createClient();

    // Get the phone number to import
    const { phoneNumber } = (await req.json()) as ImportPhoneNumberRequest;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Check if the number already exists
    const { data: existingNumber } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('number', phoneNumber)
      .single();

    if (existingNumber) {
      return NextResponse.json(
        { error: 'This phone number already exists in the system' },
        { status: 400 }
      );
    }

    // Add the phone number to the database
    const { data: number, error: insertError } = await supabase
      .from('phone_numbers')
      .insert({
        phone_number: phoneNumber,
        is_assigned: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to add phone number to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number imported successfully',
      number: number,
    });
  } catch (error: unknown) {
    console.error('Error importing phone number:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import phone number',
      },
      { status: 500 }
    );
  }
});
