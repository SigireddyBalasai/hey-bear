import { NextResponse } from 'next/server';

import twilio from 'twilio';
import type { IncomingPhoneNumberInstance } from 'twilio/lib/rest/api/v2010/account/incomingPhoneNumber';

import { createClient } from '@/utils/supabase/server';

interface PurchasePhoneNumberRequest {
  phoneNumber: string;
}

// Use Twilio SDK type instead of custom interface
type TwilioPhoneNumber = IncomingPhoneNumberInstance;

export async function POST(req: Request) {
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

    // Check admin status
    const { data: userData, error: userDataError } = await supabase

      .from('users')
      .select('is_admin, id')
      .eq('auth_user_id', user.id)
      .single();

    if (userDataError || !userData.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the phone number to purchase
    const { phoneNumber } = (await req.json()) as PurchasePhoneNumberRequest;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    try {
      // Set webhook URL for SMS - use environment variable or fallback to a default
      const webhookUrl =
        process.env.TWILIO_WEBHOOK_URL ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`;

      // Purchase the number with Twilio API
      const purchasedNumber = (await client.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        smsUrl: webhookUrl,
        smsMethod: 'POST',
      })) as TwilioPhoneNumber;

      // Add the phone number to the database
      const { data: number, error: insertError } = await supabase
        .from('phone_numbers')
        .insert({
          phone_number: purchasedNumber.phoneNumber,
          is_assigned: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        // If DB insert fails, try to release the number from Twilio
        try {
          await client.incomingPhoneNumbers(purchasedNumber.sid).remove();
        } catch (releaseError) {
          console.error('Failed to release number after DB error:', releaseError);
        }

        return NextResponse.json(
          { error: 'Failed to add phone number to database' },
          { status: 500 }
        );
      }

      // Add to phone number poo

      // Log the purchase as an interaction for auditing
      await supabase.from('interactions').insert({
        user_id: userData.id,
        chat: 'system',
        request: 'Purchase phone number',
        response: JSON.stringify({
          action: 'purchase_phone_number',
          number: purchasedNumber.phoneNumber,
          sid: purchasedNumber.sid,
        }),
        interaction_time: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Phone number purchased successfully',
        number: {
          ...number,
          sid: purchasedNumber.sid,
          friendlyName: purchasedNumber.friendlyName,
        },
      });
    } catch (twilioError: unknown) {
      console.error('Twilio API error when purchasing number:', twilioError);
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
    console.error('Error purchasing phone number:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to purchase phone number';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
