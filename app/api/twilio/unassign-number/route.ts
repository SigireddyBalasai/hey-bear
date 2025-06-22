import { NextResponse } from 'next/server';
import twilio from 'twilio';

import type { UnassignPhoneNumberRequest } from '@/types/api.types';
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
    const { assistantId } = (await req.json()) as UnassignPhoneNumberRequest;

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Get assistant and verify ownership
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, name, assigned_phone_number')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (!assistant.assigned_phone_number) {
      return NextResponse.json(
        { error: 'Assistant does not have a phone number assigned' },
        { status: 400 }
      );
    }

    // Get the phone number record
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('phone_number', assistant.assigned_phone_number)
      .eq('assistant_id', assistantId)
      .single();

    if (phoneError || !phoneNumber) {
      return NextResponse.json({ error: 'Phone number record not found' }, { status: 404 });
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const twilioClient = twilio(accountSid, authToken);

    try {
      // Clear Twilio webhooks (optional - you might want to keep them for pool management)
      if (phoneNumber.twilio_sid) {
        await twilioClient.incomingPhoneNumbers(phoneNumber.twilio_sid).update({
          smsUrl: '',
          voiceUrl: '',
        });
      }

      // Update database - unassign phone number
      const { error: updatePhoneError } = await supabase
        .from('phone_numbers')
        .update({
          assistant_id: null,
          is_assigned: false,
          sms_url: null,
          voice_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', phoneNumber.id);

      if (updatePhoneError) {
        throw new Error(`Failed to update phone number: ${updatePhoneError.message}`);
      }

      // Clear assistant phone number
      const { error: updateAssistantError } = await supabase
        .from('assistants')
        .update({
          assigned_phone_number: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assistantId);

      if (updateAssistantError) {
        throw new Error(`Failed to update assistant: ${updateAssistantError.message}`);
      }

      // Record the unassignment
      await supabase.from('interactions').insert({
        assistant_id: assistantId,
        request: JSON.stringify({
          action: 'unassign_phone_number',
          phoneNumber: assistant.assigned_phone_number,
        }),
        response: JSON.stringify({
          action: 'unassign_phone_number',
          success: true,
          phoneNumber: assistant.assigned_phone_number,
          assistantName: assistant.name,
        }),
        interaction_time: new Date().toISOString(),
        source: 'phone_unassignment',
      });

      return NextResponse.json({
        success: true,
        message: 'Phone number unassigned successfully',
        data: {
          phoneNumber: assistant.assigned_phone_number,
          assistantId,
          assistantName: assistant.name,
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
      { error: error instanceof Error ? error.message : 'Unassignment failed' },
      { status: 500 }
    );
  }
}
