import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import twilio from 'twilio';
import type { AccountInstance } from 'twilio/lib/rest/api/v2010/account';

import { type AuthContext, requireAdmin } from '@/utils/auth-utils';

interface TestConnectionRequest {
  accountSid: string;
  authToken: string;
}

export const POST = requireAdmin(async (context: AuthContext, req: NextRequest) => {
  try {
    // Get credentials from request body
    const { accountSid, authToken } = (await req.json()) as TestConnectionRequest;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Account SID and Auth Token are required' },
        { status: 400 }
      );
    }

    // If auth token is masked (unchanged), use the one from environment variables
    const actualAuthToken =
      authToken === '••••••••••••••••' ? process.env.TWILIO_AUTH_TOKEN : authToken;

    if (!actualAuthToken) {
      return NextResponse.json({ error: 'Valid Auth Token is required' }, { status: 400 });
    }

    try {
      // Initialize Twilio client with the provided credentials
      const client = twilio(accountSid, actualAuthToken);

      // Make a simple request to test the connection
      const account = (await client.api.accounts(accountSid).fetch()) as AccountInstance;

      return NextResponse.json({
        success: true,
        accountName: account.friendlyName,
      });
    } catch (twilioError: unknown) {
      console.error('Twilio API error:', twilioError);

      return NextResponse.json(
        {
          success: false,
          error: `Twilio API Error: ${twilioError instanceof Error ? twilioError.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error testing Twilio connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test Twilio connection',
      },
      { status: 500 }
    );
  }
});
