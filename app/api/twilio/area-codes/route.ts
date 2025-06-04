import { NextResponse } from 'next/server';

import twilio from 'twilio';
import type { LocalInstance } from 'twilio/lib/rest/api/v2010/account/availablePhoneNumberCountry/local';

import { isAdmin as checkIsAdmin } from '@/utils/admin';
// Renamed import
import { createClient } from '@/utils/supabase/server';

// Interface for request body
interface AreaCodeRequest {
  country?: string;
}

// Use Twilio SDK type instead of custom interface
type TwilioPhoneNumber = LocalInstance;

// Interface for area code response
interface AreaCodeInfo {
  areaCode: string;
  region: string;
  country: string;
  phoneNumber: string;
  capabilities: {
    voice?: boolean;
    SMS?: boolean;
    MMS?: boolean;
    fax?: boolean;
  };
}

// Simplified API that returns flat area code data for the UI to sort and group
export async function POST(request: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the checkIsAdmin utility function instead of direct database query
    const isUserAdmin = await checkIsAdmin(user.id); // Adjusted call

    if (!isUserAdmin) {
      // Adjusted condition
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body with proper typing
    const requestBody = (await request.json()) as AreaCodeRequest;
    const { country = 'US' } = requestBody;

    // Get the Twilio client using environment variables
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Query available phone numbers from Twilio with proper typing
    const availablePhoneNumbers = twilioClient.availablePhoneNumbers(country);

    // Extract relevant data from Twilio response
    const phoneNumberList = await availablePhoneNumbers.local.list();
    const areaCodes: AreaCodeInfo[] = phoneNumberList.map((number: TwilioPhoneNumber) => {
      // Extract area code from the phone number
      // This is simplified - actual implementation depends on number format
      const areaCode = number.phoneNumber.slice(2, 5); // Skip +1 and get area code

      return {
        areaCode,
        region: number.locality ?? number.region ?? 'Unknown', // Use Twilio locality/region data if available
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
  } catch (error: unknown) {
    console.error('Error fetching area codes:', error);

    // If Twilio API isn't available or configured, return empty results
    if (
      (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') ||
      (error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string' &&
        error.message.includes('Twilio')) ||
      !process.env.TWILIO_ACCOUNT_SID
    ) {
      return NextResponse.json({
        success: true,
        areaCodes: [],
        notice: 'Twilio configuration not available - returned empty results',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch area codes',
      },
      { status: 500 }
    );
  }
}
