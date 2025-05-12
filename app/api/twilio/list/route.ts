import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import twilio from 'twilio';

export async function GET(req: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status - Fix the issue by checking auth_user_id not user.id
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)  // Use auth_user_id instead of user.id
      .single();

    if (userDataError || !userData?.is_admin) {
      console.log('Admin check failed:', userDataError, userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Check if Twilio credentials are configured
    if (!accountSid || !authToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Twilio credentials not configured',
        twilioNumbers: [],
        dbNumbers: [],
        unmanagedNumbers: []
      });
    }

    // Get phone numbers from database
    const { data: dbNumbers, error: dbError } = await supabase
      .from('phone_numbers')
      .select('*');

    if (dbError) {
      console.error('Database error fetching phone numbers:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch database phone numbers',
        twilioNumbers: [],
        dbNumbers: [],
        unmanagedNumbers: []
      }, { status: 500 });
    }

    try {
      // Initialize Twilio client
      const client = twilio(accountSid, authToken);
      
      // Get all phone numbers from Twilio
      const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();

      // Format the response
      const formattedNumbers = incomingPhoneNumbers.map(number => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName || number.phoneNumber,
        capabilities: number.capabilities || { sms: false, voice: false, mms: false },
        dateCreated: number.dateCreated,
        smsUrl: number.smsUrl,
        voiceUrl: number.voiceUrl
      }));

      // Find which Twilio numbers aren't in the database yet
      const dbPhoneNumbersSet = new Set((dbNumbers || []).map(n => n.phone_number));
      const unmanagedNumbers = formattedNumbers.filter(n => !dbPhoneNumbersSet.has(n.phoneNumber));

      return NextResponse.json({
        success: true,
        twilioNumbers: formattedNumbers,
        dbNumbers: dbNumbers || [],
        unmanagedNumbers: unmanagedNumbers
      });
    } catch (twilioError: any) {
      console.error('Twilio API error:', twilioError);
      
      // Return database numbers even if Twilio API fails
      return NextResponse.json({
        success: false, 
        error: `Failed to fetch Twilio phone numbers: ${twilioError.message}`,
        twilioNumbers: [],
        dbNumbers: dbNumbers || [],
        unmanagedNumbers: []
      }, {
        status: 500
      });
    }
  } catch (error: any) {
    console.error('Error listing phone numbers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to list phone numbers'
      },
      { status: 500 }
    );
  }
}
