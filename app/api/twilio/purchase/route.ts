import { NextResponse } from 'next/server';
import twilio from 'twilio';

import type { PurchaseRequestBody } from '@/types/api.types';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // Authenticate user and check admin privileges
    const authCheck = await authenticateAdmin();

    if (!authCheck.success) {
      return authCheck.response;
    }

    // Parse request
    const { phoneNumber, areaCode, countryCode = 'US' } = (await req.json()) as PurchaseRequestBody;

    if (!phoneNumber && !areaCode) {
      return NextResponse.json(
        { error: 'Either phone number or area code is required' },
        { status: 400 }
      );
    }

    // Initialize Twilio
    const twilioClient = createTwilioClient();

    if (!twilioClient) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Purchase the number
    return await purchaseNumber(twilioClient, phoneNumber, areaCode, countryCode);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Purchase failed' },
      { status: 500 }
    );
  }
}

async function authenticateAdmin() {
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

  const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');

  if (adminError || !adminCheck) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { success: true };
}

function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  return twilio(accountSid, authToken);
}

async function purchaseNumber(
  client: twilio.Twilio,
  phoneNumber?: string,
  areaCode?: string,
  countryCode = 'US'
) {
  const supabase = await createClient();

  // Determine which number to purchase
  let numberToPurchase = phoneNumber;

  if (!numberToPurchase && areaCode) {
    const availableNumbers = await client.availablePhoneNumbers(countryCode).local.list({
      areaCode: Number(areaCode),
      limit: 1,
    });

    if (availableNumbers.length === 0) {
      return NextResponse.json(
        { error: `No available numbers for area code ${areaCode}` },
        { status: 404 }
      );
    }

    numberToPurchase = availableNumbers[0].phoneNumber;
  }

  if (!numberToPurchase) {
    return NextResponse.json(
      { error: 'Unable to determine phone number to purchase' },
      { status: 400 }
    );
  }

  // Purchase from Twilio
  const webhookUrl =
    process.env.TWILIO_WEBHOOK_URL ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`;

  const purchasedNumber = await client.incomingPhoneNumbers.create({
    phoneNumber: numberToPurchase,
    smsUrl: webhookUrl,
    smsMethod: 'POST',
    voiceUrl: webhookUrl,
    voiceMethod: 'POST',
  });

  // Save to database
  const { data: number, error: insertError } = await supabase
    .from('phone_numbers')
    .insert({
      phone_number: purchasedNumber.phoneNumber,
      twilio_sid: purchasedNumber.sid,
      country: countryCode,
      capabilities: { sms: true, voice: true },
      sms_url: webhookUrl,
      voice_url: webhookUrl,
      status: 'active',
      is_assigned: false,
    })
    .select()
    .single();

  if (insertError) {
    // Clean up Twilio number if database save failed
    await client
      .incomingPhoneNumbers(purchasedNumber.sid)
      .remove()
      .catch(() => {
        // Ignore cleanup errors
      });

    return NextResponse.json({ error: 'Failed to save phone number to database' }, { status: 500 });
  }

  // Log the purchase
  await supabase.from('interactions').insert({
    assistant_id: 'system',
    request: JSON.stringify({ action: 'purchase_phone_number', phoneNumber: numberToPurchase }),
    response: JSON.stringify({
      action: 'purchase_phone_number',
      number: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid,
    }),
    interaction_time: new Date().toISOString(),
    source: 'admin_api',
  });

  return NextResponse.json({
    success: true,
    message: 'Phone number purchased successfully',
    data: {
      id: number.id,
      phoneNumber: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid,
      friendlyName: purchasedNumber.friendlyName,
    },
  });
}
