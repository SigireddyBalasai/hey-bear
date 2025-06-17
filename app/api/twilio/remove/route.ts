import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import Twilio from 'twilio';

import type { RemovePhoneNumberRequest } from '@/types/api.types';
import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const POST = requireAdmin(async (context, req: NextRequest) => {
  const supabase = await createClient();
  const { phoneNumber } = (await req.json()) as RemovePhoneNumberRequest;

  const { data: phoneData, error: fetchError } = await supabase
    .from('phone_numbers')
    .select('twilio_sid')
    .eq('phone_number', phoneNumber)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
  }

  try {
    if (phoneData.twilio_sid) {
      await twilioClient.incomingPhoneNumbers(phoneData.twilio_sid).remove();
    }

    const { error } = await supabase.from('phone_numbers').delete().eq('phone_number', phoneNumber);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Phone number ${phoneNumber} removed from pool`,
    });
  } catch (error: unknown) {
    console.error('Error removing number:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove number';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
});
