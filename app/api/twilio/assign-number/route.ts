import { NextResponse } from 'next/server';

import twilio from 'twilio';

import type { AssignPhoneNumberRequest } from '@/types/api.types';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { assistantId, phoneNumberId, webhookUrl } =
      (await req.json()) as AssignPhoneNumberRequest;

    if (!assistantId || !phoneNumberId) {
      return NextResponse.json(
        { error: 'Assistant ID and phone number ID are required' },
        { status: 400 }
      );
    }

    // Verify assistant exists and user owns it
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, name, assigned_phone_number')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Get the phone number
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', phoneNumberId)
      .eq('is_assigned', false)
      .single();

    if (phoneError || !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found or already assigned' },
        { status: 404 }
      );
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const twilioClient = twilio(accountSid, authToken);

    // Set up webhook URLs
    const defaultWebhookUrl =
      webhookUrl ??
      `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/gateway?assistantId=${assistantId}`;

    try {
      // Update Twilio phone number with webhooks
      if (phoneNumber.twilio_sid) {
        await twilioClient.incomingPhoneNumbers(phoneNumber.twilio_sid).update({
          smsUrl: defaultWebhookUrl,
          smsMethod: 'POST',
          voiceUrl: defaultWebhookUrl,
          voiceMethod: 'POST',
        });
      }

      // Update database - assign phone number to assistant
      const { error: updatePhoneError } = await supabase
        .from('phone_numbers')
        .update({
          assistant_id: assistantId,
          is_assigned: true,
          sms_url: defaultWebhookUrl,
          voice_url: defaultWebhookUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', phoneNumberId);

      if (updatePhoneError) {
        throw new Error(`Failed to update phone number: ${updatePhoneError.message}`);
      }

      // Update assistant with assigned phone number
      const { error: updateAssistantError } = await supabase
        .from('assistants')
        .update({
          assigned_phone_number: phoneNumber.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assistantId);

      if (updateAssistantError) {
        // Rollback phone number assignment
        await supabase
          .from('phone_numbers')
          .update({
            assistant_id: null,
            is_assigned: false,
          })
          .eq('id', phoneNumberId);

        throw new Error(`Failed to update assistant: ${updateAssistantError.message}`);
      }

      // Record the assignment
      await supabase.from('interactions').insert({
        assistant_id: assistantId,
        request: JSON.stringify({
          action: 'assign_phone_number',
          phoneNumber: phoneNumber.phone_number,
          webhookUrl: defaultWebhookUrl,
        }),
        response: JSON.stringify({
          action: 'assign_phone_number',
          success: true,
          phoneNumber: phoneNumber.phone_number,
          assistantName: assistant.name,
        }),
        interaction_time: new Date().toISOString(),
        source: 'phone_assignment',
      });

      return NextResponse.json({
        success: true,
        message: 'Phone number assigned successfully',
        data: {
          phoneNumber: phoneNumber.phone_number,
          assistantId,
          assistantName: assistant.name,
          webhookUrl: defaultWebhookUrl,
        },
      });
    } catch (twilioError) {
      return NextResponse.json(
        {
          error: `Twilio configuration failed: ${twilioError instanceof Error ? twilioError.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assignment failed' },
      { status: 500 }
    );
  }
}
