import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@/utils/supabase/server';
import { checkIsAdmin } from '@/utils/admin';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export async function POST(request: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the checkIsAdmin utility function
    const { isAdmin, error: adminError } = await checkIsAdmin(supabase, user.id);
    
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { twilioSid, phoneNumber, adminId } = body;

    if (!twilioSid && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either twilioSid or phoneNumber must be provided' },
        { status: 400 }
      );
    }
    
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Find the SID if only phone number is provided
    let sid = twilioSid;
    if (!sid && phoneNumber) {
      const numbers = await client.incomingPhoneNumbers.list({
        phoneNumber,
        limit: 1,
      });
      
      if (numbers.length === 0) {
        return NextResponse.json(
          { error: 'Phone number not found in Twilio account' },
          { status: 404 }
        );
      }
      
      sid = numbers[0].sid;
    }

    // Release the number in Twilio
    if (sid) {
      await client.incomingPhoneNumbers(sid).remove();
    }

    if (phoneNumber) {
      await supabase
        .from('phone_numbers')
        .update({ is_assigned: false })
        .eq('number', phoneNumber);
    }
    return NextResponse.json({
      success: true,
      message: 'Phone number released successfully',
    });
  } catch (error: any) {
    console.error('Error releasing phone number:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to release phone number'
      },
      { status: 500 }
    );
  }
}