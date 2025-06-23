import { NextResponse } from 'next/server';

import twilio from 'twilio';

import { createClient } from '@/utils/supabase/server-admin';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user authentication and admin status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using RPC function
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');

    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Initialize Twilio client
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Fetch all phone numbers from Twilio
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();

    // Transform the data to include relevant information
    const formattedNumbers = phoneNumbers.map(number => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: number.capabilities,
      voiceUrl: number.voiceUrl,
      smsUrl: number.smsUrl,
      statusCallback: number.statusCallback,
      dateCreated: number.dateCreated,
      dateUpdated: number.dateUpdated,
    }));

    return NextResponse.json({
      success: true,
      phoneNumbers: formattedNumbers,
      total: formattedNumbers.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
  }
}
