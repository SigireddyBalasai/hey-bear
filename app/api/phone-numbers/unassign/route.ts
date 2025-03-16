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
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    if (!incomingPhoneNumbers || incomingPhoneNumbers.length === 0) {
      throw new Error(`No Twilio number found matching ${phoneNumber}`);
    }
    
    const incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;

    // Get the TwiML app SID from the phone number
    const incomingPhoneNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid).fetch();
    const twimlAppSid = incomingPhoneNumber.smsApplicationSid;

    console.log('Found TwiML app SID:', twimlAppSid || 'No SID attached to phone number');

    // Use empty strings instead of null to clear the ApplicationSid fields
    // Twilio's TypeScript types don't allow null, but empty strings work to clear these values
    const updateParams = {
      smsApplicationSid: '',
      voiceApplicationSid: ''
    };

    // Clear the webhook URL for SMS and Voice
    const updatedNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update(updateParams)
      .catch(err => {
        throw new Error(`Failed to clear webhook URLs: ${err.message}`);
      });
      
    console.log('Cleared application SIDs from phone number:', updatedNumber.phoneNumber);
    console.log('New smsApplicationSid value:', updatedNumber.smsApplicationSid || 'cleared');

    // Delete the TwiML app
    if (twimlAppSid) {
      console.log('Attempting to delete TwiML app:', twimlAppSid);
      await client.applications(twimlAppSid).remove()
        .catch(err => {
          throw new Error(`Failed to delete TwiML app: ${err.message}`);
        });
      console.log('TwiML app deleted successfully:', twimlAppSid);
    } else {
      console.log('No TwiML app to delete');
    }
  } catch (error) {
    console.error('Error updating Twilio webhook:', error);
    throw error;
  }
}
