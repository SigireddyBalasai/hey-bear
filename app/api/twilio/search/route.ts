import { NextResponse } from 'next/server';

import twilio from 'twilio';
import type { LocalInstance } from 'twilio/lib/rest/api/v2010/account/availablePhoneNumberCountry/local';

import { requireAdmin } from '@/utils/auth-utils';

interface SearchPhoneNumberRequest {
  areaCode: string;
  country?: string;
  smsEnabled?: boolean;
}

export const POST = requireAdmin(async (context, req) => {
  try {
    // Get search parameters
    const {
      areaCode,
      country = 'US',
      smsEnabled = true,
    } = (await req.json()) as SearchPhoneNumberRequest;

    if (!areaCode) {
      return NextResponse.json({ error: 'Area code is required' }, { status: 400 });
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Check if Twilio credentials are configured
    if (!accountSid || !authToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Twilio credentials not configured',
        },
        { status: 500 }
      );
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Build search parameters
    const searchParams: {
      areaCode: number;
      limit: number;
      smsEnabled?: boolean;
    } = {
      areaCode: Number.parseInt(areaCode),
      limit: 10,
    };

    if (smsEnabled) {
      searchParams.smsEnabled = true;
    }

    try {
      // Search for phone numbers using Twilio API
      const availableNumbers = (await client
        .availablePhoneNumbers(country)
        .local.list(searchParams)) as LocalInstance[];

      // Format the response
      const formattedNumbers = availableNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality || 'Unknown',
        region: number.region || 'Unknown',
        isoCountry: number.isoCountry,
        capabilities: number.capabilities,
      }));

      return NextResponse.json({
        success: true,
        numbers: formattedNumbers,
      });
    } catch (twilioError: unknown) {
      console.error('Twilio API error:', twilioError);
      const errorMessage =
        twilioError instanceof Error ? twilioError.message : 'Unknown Twilio error';

      return NextResponse.json(
        {
          success: false,
          error: `Twilio API Error: ${errorMessage}`,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error searching for phone numbers:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to search for phone numbers';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
});
