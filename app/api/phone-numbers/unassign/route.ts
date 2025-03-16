import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { Tables } from '@/lib/db.types';

export async function POST(request: Request) {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Phone Number Unassignment - START`);
  
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Unauthorized request`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[${new Date().toISOString()}] Phone Number Unassignment - User authenticated: ${user.id}`);

    // Parse the request body
    const { assistantId, phoneNumber } = await request.json();
    console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Request body:`, { assistantId, phoneNumber });
    
    // Validate required fields
    if (!assistantId || !phoneNumber) {
      console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Missing fields`);
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Check if assistant has this phone number assigned
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('id, assigned_phone_number')
      .eq('id', assistantId)
      .eq('assigned_phone_number', phoneNumber)
      .single();
    
    if (assistantError || !assistantData) {
      console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Phone number is not assigned to this assistant`);
      return NextResponse.json(
        { error: 'Phone number is not assigned to this assistant' }, 
        { status: 404 }
      );
    }
    
    // Get the phone number record
    const { data: phoneNumberData, error: phoneNumberError } = await supabase
      .from('phonenumbers')
      .select('*')
      .eq('number', phoneNumber)
      .single();
    
    if (phoneNumberError || !phoneNumberData) {
      console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Phone number not found in database`);
      return NextResponse.json(
        { error: 'Phone number not found in database' }, 
        { status: 404 }
      );
    }
    
    // 1. Clear webhook if using Twilio or other SMS provider
    try {
      if (process.env.SMS_PROVIDER === 'twilio') {
        console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Clearing Twilio webhook...`);
        await updateTwilioWebhook(phoneNumber, null);
        console.log(`[${new Date().toISOString()}] Phone Number Unassignment - Successfully cleared Twilio webhook`);
      }
      // Other SMS providers could be added here
    } catch (smsError) {
      console.error("SMS provider error:", smsError);
      // Continue anyway as we want to unassign in our database
    }
    
    // 2. Update phone number as unassigned
    const { error: updatePhoneError } = await supabase
      .from('phonenumbers')
      .update({ is_assigned: false })
      .eq('number', phoneNumber);
    
    if (updatePhoneError) {
      console.error(`[${new Date().toISOString()}] Phone Number Unassignment - Update phone error:`, updatePhoneError);
      return NextResponse.json(
        { error: 'Failed to unassign phone number' }, 
        { status: 500 }
      );
    }
    
    // 3. Update assistant to remove phone number
    const { error: updateAssistantError } = await supabase
      .from('assistants')
      .update({ assigned_phone_number: null })
      .eq('id', assistantId);
    
    if (updateAssistantError) {
      console.error(`[${new Date().toISOString()}] Phone Number Unassignment - Update assistant error:`, updateAssistantError);
      try {
        await supabase
          .from('phonenumbers')
          .update({ is_assigned: true })
          .eq('number', phoneNumber);
      } catch (revertError) {
        console.error("Failed to revert phone number assignment:", revertError);
      }
      
      return NextResponse.json(
        { error: 'Failed to update assistant record' }, 
        { status: 500 }
      );
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] Phone Number Unassignment - END - Duration: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Phone number unassigned successfully',
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Phone Number Unassignment - ERROR:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// Function to update Twilio webhook
async function updateTwilioWebhook(phoneNumber: string, webhookUrl: string | null) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  try {
    // Dynamic import of twilio to avoid server-side issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Format number for Twilio if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Find the Twilio phone number
    console.log(`[${new Date().toISOString()}] updateTwilioWebhook - Finding Twilio number: ${formattedNumber}`);
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    if (!incomingPhoneNumbers || incomingPhoneNumbers.length === 0) {
      throw new Error(`No Twilio number found matching ${phoneNumber}`);
    }
    
    const incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;
    console.log(`[${new Date().toISOString()}] updateTwilioWebhook - Found Twilio number SID: ${incomingPhoneNumberSid}`);

    // Update the webhook URL for SMS and Voice
    console.log(`[${new Date().toISOString()}] updateTwilioWebhook - Updating Twilio number with:`, { smsUrl: webhookUrl || '', voiceUrl: webhookUrl || '' });
    try {
      const updateParams = {
        smsMethod: 'POST',
        smsUrl: webhookUrl || '',
        voiceMethod: 'POST',
        voiceUrl: webhookUrl || ''
      };
      console.log(`[${new Date().toISOString()}] updateTwilioWebhook - Update parameters:`, updateParams);

      await client.incomingPhoneNumbers(incomingPhoneNumberSid)
        .update(updateParams);
      console.log(`[${new Date().toISOString()}] updateTwilioWebhook - Twilio update successful`);
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] updateTwilioWebhook - Twilio update failed:`, e);
    }
      
    console.log(`[${new Date().toISOString()}] Twilio webhook updated successfully for ${phoneNumber}`);

    // Verify the webhook configuration
    try {
      const updatedNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid).fetch();
      console.log(`[${new Date().toISOString()}] Twilio number details after update:`, {
        smsUrl: updatedNumber.smsUrl,
        voiceUrl: updatedNumber.voiceUrl
      });
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] updateTwilioWebhook - Twilio fetch failed:`, e);
    }
  } catch (error) {
    console.error('Error updating Twilio webhook:', error);
    throw error;
  }
}
