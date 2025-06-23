import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import twilio from 'twilio';

import type { DirectSMSRequest } from '@/types/api.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

export const POST = requireAuth(async (_context, request: NextRequest) => {
  try {
    const supabase = await createClient();

    const requestBody = (await request.json()) as DirectSMSRequest;
    const { to, message, assistantId } = requestBody;

    if (!to || !message) {
      return NextResponse.json(
        {
          error: 'Missing required fields: "to" and "message" are required',
        },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    let from = process.env.TWILIO_PHONE_NUMBER;

    if (assistantId) {
      try {
        const { data: assistant } = await supabase

          .from('assistants')
          .select('*')
          .eq('id', assistantId)
          .single();

        if (assistant?.assigned_phone_number) {
          from = assistant.assigned_phone_number;
        }
      } catch {
        console.warn('Failed to get assistant phone number, using default');
      }
    }

    if (!from) {
      return NextResponse.json(
        {
          error: 'No phone number available to send from',
        },
        { status: 400 }
      );
    }

    try {
      // Send message using real Twilio client
      const result = await twilioClient.messages.create({
        body: message,
        from,
        to,
      });

      console.log(`SMS sent with SID: ${result.sid}, status: ${result.status}`);

      // Return success with message details
      return NextResponse.json({
        success: true,
        messageSid: result.sid,
        status: result.status,
        from,
        to,
      });
    } catch (error: unknown) {
      console.error('Mock Twilio error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return NextResponse.json(
        {
          error: `Error sending SMS: ${errorMessage}`,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error in direct SMS endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: `Server error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
});

// Endpoint to check status of a sent message
export const GET = requireAuth(async (_context, request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const messageSid = url.searchParams.get('sid');

    if (!messageSid) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: "sid"',
        },
        { status: 400 }
      );
    }

    // For mock implementation, just return a success status
    return NextResponse.json({
      success: true,
      sid: messageSid,
      status: 'delivered',
      dateCreated: new Date(Date.now() - 60_000).toISOString(), // 1 minute ago
      dateUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error checking message status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: `Server error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
});
