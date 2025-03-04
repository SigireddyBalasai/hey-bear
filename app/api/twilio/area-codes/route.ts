import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkIsAdmin } from '@/utils/admin';
import twilio from 'twilio';

// Simplified API that returns flat area code data for the UI to sort and group
export async function POST(request: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the checkIsAdmin utility function instead of direct database query
    const { isAdmin, error: adminError } = await checkIsAdmin(supabase, user.id);
    
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { country = 'US' } = body;
    
    // Get the Twilio client using environment variables
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Query available phone numbers from Twilio
    // This is a simplified version - in a real implementation you might
    // need to handle pagination and additional filters
    const availablePhoneNumbers = await twilioClient.availablePhoneNumbers(country)
      .fetch();

    // Extract relevant data from Twilio response
    const areaCodes = (await availablePhoneNumbers.local().list()).map(number => {
      // Extract area code from the phone number
      // This is simplified - actual implementation depends on number format
      const areaCode = number.phoneNumber.slice(0, 3); // Simplified example
      
      return {
        areaCode,
        region: number.locality || number.region || 'Unknown', // Use Twilio locality/region data if available
        country: number.isoCountry,
        phoneNumber: number.phoneNumber,
        capabilities: number.capabilities,
      };
    });

    // Return flattened data - let the UI handle sorting and grouping
    return NextResponse.json({
      success: true,
      areaCodes,
    });
  } catch (error: any) {
    console.error('Error fetching area codes:', error);
    
    // If Twilio API isn't available or configured, return empty results
    if (error.code === 'ECONNREFUSED' || 
        error.message.includes('Twilio') || 
        !process.env.TWILIO_ACCOUNT_SID) {
      return NextResponse.json({
        success: true,
        areaCodes: [],
        notice: 'Twilio configuration not available - returned empty results'
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch area codes'
      },
      { status: 500 }
    );
  }
}