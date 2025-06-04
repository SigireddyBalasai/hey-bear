import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import Twilio from 'twilio';

import { isAdmin as checkIsAdmin } from '@/utils/admin';
// Renamed import
import { createClient } from '@/utils/supabase/server';

interface RemovePhoneNumberRequest {
  phoneNumber: string;
}

const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  const { phoneNumber } = (await req.json()) as RemovePhoneNumberRequest;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use the checkIsAdmin utility function
  const isUserAdmin = await checkIsAdmin(user.id); // Adjusted call

  if (!isUserAdmin) {
    // Adjusted condition
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

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
}
