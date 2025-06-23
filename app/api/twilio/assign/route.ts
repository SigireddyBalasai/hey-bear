import { NextResponse } from 'next/server';

import twilio from 'twilio';

import type { AssignRequestBody } from '@/types/api.types';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // Authenticate user
    const authResult = await authenticateUser();

    if (!authResult.success) {
      return authResult.response;
    }

    // Parse and validate request
    const { phoneNumberId, assistantId, webhookUrl } = (await req.json()) as AssignRequestBody;

    if (!phoneNumberId || !assistantId) {
      return NextResponse.json(
        { error: 'Phone number ID and assistant ID are required' },
        { status: 400 }
      );
    }

    // Assign the number
    if (authResult.userId) {
      return await assignPhoneNumber(authResult.userId, phoneNumberId, assistantId, webhookUrl);
    }

    return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assignment failed' },
      { status: 500 }
    );
  }
}

async function authenticateUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { success: true, userId: user.id };
}

async function assignPhoneNumber(
  userId: string,
  phoneNumberId: string,
  assistantId: string,
  webhookUrl?: string
) {
  const supabase = await createClient();

  // Validate assistant ownership
  const { data: assistant, error: assistantError } = await supabase
    .from('assistants')
    .select('id, user_id, name')
    .eq('id', assistantId)
    .eq('user_id', userId)
    .single();

  if (assistantError || !assistant) {
    return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
  }

  // Get available phone number
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

  // Set up webhook
  const finalWebhookUrl =
    webhookUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook?assistantId=${assistantId}`;

  // Update Twilio configuration
  await updateTwilioWebhook(phoneNumber.twilio_sid, finalWebhookUrl);

  // Update database
  const updateResult = await updateDatabase(
    supabase,
    phoneNumberId,
    assistantId,
    phoneNumber.phone_number,
    finalWebhookUrl
  );

  if (!updateResult.success) {
    return updateResult.response;
  }

  // Log the assignment
  await supabase.from('interactions').insert({
    assistant_id: assistantId,
    request: JSON.stringify({
      action: 'assign_phone_number',
      phoneNumber: phoneNumber.phone_number,
      assistantName: assistant.name,
    }),
    response: JSON.stringify({
      success: true,
      phoneNumber: phoneNumber.phone_number,
      webhookUrl: finalWebhookUrl,
    }),
    interaction_time: new Date().toISOString(),
    source: 'api',
  });

  return NextResponse.json({
    success: true,
    message: 'Phone number assigned successfully',
    data: {
      phoneNumber: phoneNumber.phone_number,
      assistantId,
      assistantName: assistant.name,
      webhookUrl: finalWebhookUrl,
    },
  });
}

async function updateTwilioWebhook(twilioSid: string | null, webhookUrl: string) {
  if (!twilioSid) return;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return;

  try {
    const client = twilio(accountSid, authToken);

    await client.incomingPhoneNumbers(twilioSid).update({
      smsUrl: webhookUrl,
      smsMethod: 'POST',
      voiceUrl: webhookUrl,
      voiceMethod: 'POST',
    });
  } catch {
    // Continue with assignment even if Twilio update fails
  }
}

async function updateDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumberId: string,
  assistantId: string,
  phoneNumber: string,
  webhookUrl: string
) {
  // Update phone number assignment
  const { error: updatePhoneError } = await supabase
    .from('phone_numbers')
    .update({
      assistant_id: assistantId,
      is_assigned: true,
      sms_url: webhookUrl,
      voice_url: webhookUrl,
    })
    .eq('id', phoneNumberId);

  if (updatePhoneError) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Failed to assign phone number' }, { status: 500 }),
    };
  }

  // Update assistant with assigned phone number
  const { error: updateAssistantError } = await supabase
    .from('assistants')
    .update({ assigned_phone_number: phoneNumber })
    .eq('id', assistantId);

  if (updateAssistantError) {
    // Rollback phone number assignment
    await supabase
      .from('phone_numbers')
      .update({ assistant_id: null, is_assigned: false })
      .eq('id', phoneNumberId);

    return {
      success: false,
      response: NextResponse.json({ error: 'Failed to update assistant' }, { status: 500 }),
    };
  }

  return { success: true };
}
