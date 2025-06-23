'use server';

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';
import twilio from 'twilio';

import type { TwilioPhoneNumber } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

async function processPhoneNumber(
  supabase: SupabaseClient<Database>,
  number: TwilioPhoneNumber
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if phone number already exists in database
    const { data: existingNumber } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('twilio_sid', number.sid)
      .single();

    if (existingNumber) {
      return { success: false, error: 'already_exists' };
    }

    // Insert phone number into database
    const { error: insertError } = await supabase.from('phone_numbers').insert({
      phone_number: number.phoneNumber,
      twilio_sid: number.sid,
      capabilities:
        number.capabilities as Database['public']['Tables']['phone_numbers']['Insert']['capabilities'],
      country: number.isoCountry ?? null,
      voice_url: number.voiceUrl ?? null,
      sms_url: number.smsUrl ?? null,
      sms_fallback_url: number.smsFallbackUrl ?? null,
      status: 'active',
      is_assigned: false,
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const importTwilioNumbers = requireAdmin(async () => {
  try {
    const supabase = await createClient();

    // Initialize Twilio client
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Fetch all phone numbers from Twilio
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const number of phoneNumbers) {
      const result = await processPhoneNumber(supabase, number);

      if (result.success) {
        importedCount++;
      } else if (result.error === 'already_exists') {
        skippedCount++;
      } else {
        errors.push(`Failed to import ${number.phoneNumber}: ${result.error}`);
      }
    }

    // Revalidate the admin page to show updated data
    revalidatePath('/admin');

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      total: phoneNumbers.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import phone numbers',
      },
      { status: 500 }
    );
  }
});
