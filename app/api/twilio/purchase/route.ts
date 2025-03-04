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
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Purchase the number
    const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
      // Configure sms URL and voice URL if needed
      // smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/receive`,
      // voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/receive`,
    });

    // Save number in database
    const { data: numberData, error: insertError } = await supabase
      .from('phone_numbers')
      .insert({
        phone_number: incomingPhoneNumber.phoneNumber,
        twilio_sid: incomingPhoneNumber.sid,
        assigned_to_user_id: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving phone number to DB:', insertError);
      
      // If DB insert fails, try to release the number from Twilio
      try {
        await client.incomingPhoneNumbers(incomingPhoneNumber.sid).remove();
      } catch (releaseError) {
        console.error('Failed to release number after DB error:', releaseError);
      }
      
      return NextResponse.json(
        { error: 'Failed to save phone number data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number purchased successfully',
      number: numberData,
    });
  } catch (error: any) {
    console.error('Error purchasing phone number:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to purchase phone number'
      },
      { status: 500 }
    );
  }
}