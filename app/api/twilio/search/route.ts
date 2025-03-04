import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@/utils/supabase/server';
import { checkIsAdmin } from '@/utils/admin';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export async function POST(request: Request) {
  try {
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
    const { areaCode, country, smsEnabled } = body;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);
    
    // Build search parameters
    const searchParams: any = {
      limit: 10,
      capabilities: {},
    };
    
    if (country) {
      searchParams.countryCode = country;
    }
    
    if (areaCode) {
      searchParams.areaCode = areaCode;
    }
    
    if (smsEnabled) {
      searchParams.capabilities.sms = true;
    }

    // Search for phone numbers
    const availableNumbers = await client.availablePhoneNumbers(country || 'US').local.list(searchParams);

    const formattedNumbers = availableNumbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
      isoCountry: number.isoCountry,
      capabilities: number.capabilities,
    }));

    return NextResponse.json({
      success: true,
      numbers: formattedNumbers,
    });
  } catch (error: any) {
    console.error('Error searching for phone numbers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to search for phone numbers'
      },
      { status: 500 }
    );
  }
}