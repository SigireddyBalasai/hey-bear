import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Twilio from 'twilio';
import { checkIsAdmin } from '@/utils/admin';

const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  const { phoneNumber } = await req.json();
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use the checkIsAdmin utility function
  const { isAdmin, error: adminError } = await checkIsAdmin(supabase, user.id);
  
  if (adminError || !isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { data: phoneData, error: fetchError } = await supabase
    .from('phone_numbers')
    .select('twilio_sid')
    .eq('phone_number', phoneNumber)
    .single();

  if (fetchError || !phoneData) {
    return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
  }

  try {
    await twilioClient.incomingPhoneNumbers(phoneData.twilio_sid).remove();

    const { error } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('phone_number', phoneNumber);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Phone number ${phoneNumber} removed from pool` });
  } catch (error) {
    console.error('Error removing number:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove number' }, { status: 500 });
  }
}