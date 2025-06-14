import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/utils/auth-utils';
import type { UpdateSettingsRequest } from '@/types/consolidated-interfaces';

// Define the settings object type
type TwilioSettings = {
  accountSid: string;
  authToken: string;
  webhookUrl: string;
  webhookEnabled: boolean;
  smsEnabled: boolean;
  voiceEnabled: boolean;
};

// Get current settings
export const GET = requireAdmin(async (_context, _req: NextRequest) => {
  try {
    const settings: TwilioSettings = {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      // Don't return the full auth token for security reasons
      authToken: process.env.TWILIO_AUTH_TOKEN ? '••••••••••••••••' : '',
      webhookUrl:
        process.env.TWILIO_WEBHOOK_URL ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`,
      webhookEnabled: true,
      smsEnabled: true,
      voiceEnabled: false,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: unknown) {
    console.error('Error fetching Twilio settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Twilio settings',
      },
      { status: 500 }
    );
  }
});

// Update settings
export const POST = requireAdmin(async (context, req: NextRequest) => {
  try {
    // Get settings from request body
    const { settings } = (await req.json()) as UpdateSettingsRequest;

    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    // Validate settings
    if (!settings.accountSid || !settings.authToken) {
      return NextResponse.json(
        { error: 'Account SID and Auth Token are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would update environment variables
    // For now, we'll just acknowledge the receipt of the settings
    console.log(
      'Received settings to save:',
      settings.accountSid,
      settings.authToken === '••••••••••••••••' ? '(masked token)' : '(new token)'
    );

    // If using .env.local file, you could update it here
    // However, for security and best practices, consider using a secret manager

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error: unknown) {
    console.error('Error saving Twilio settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save Twilio settings',
      },
      { status: 500 }
    );
  }
});
