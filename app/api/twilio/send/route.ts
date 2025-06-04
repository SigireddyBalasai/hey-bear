import { NextResponse } from 'next/server';

import twilio from 'twilio';
import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

import { createClient } from '@/utils/supabase/server';

interface SendMessageRequest {
  to: string;
  message: string;
  assistantId: string;
}

export async function POST(req: Request) {
  try {
    const { to, message, assistantId } = (await req.json()) as SendMessageRequest;

    if (!to || !message || !assistantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Find the assistant
    const { data: assistant, error: assistantError } = await supabase

      .from('assistants')
      .select('id, name, user_id, assigned_phone_number')
      .eq('id', assistantId)
      .single();

    if (assistantError) {
      console.error('No-show not found:', assistantId, assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (!assistant.assigned_phone_number) {
      return NextResponse.json(
        { error: 'This No-show does not have an assigned phone number' },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Send the message using the Twilio API
    const twilioResponse = (await client.messages.create({
      body: message,
      from: assistant.assigned_phone_number,
      to: to,
    })) as MessageInstance;

    // Record the interaction
    await supabase.from('interactions').insert({
      user_id: assistant.user_id,
      assistant_id: assistant.id,
      request: 'SMS outbound',
      response: message,
      chat: JSON.stringify({ from: assistant.assigned_phone_number, to, body: message }),
      interaction_time: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      messageId: twilioResponse.sid,
      status: twilioResponse.status,
    });
  } catch (error: unknown) {
    console.error('Error sending SMS via Twilio:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      },
      { status: 500 }
    );
  }
}
