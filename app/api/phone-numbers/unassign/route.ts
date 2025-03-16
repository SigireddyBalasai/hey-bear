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
async function updateTwilioWebhook(phoneNumber: string, webhookUrl: string | null, knownAppSid?: string | null) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  try {
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Starting webhook update for phone number: ${phoneNumber}`);
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Known app SID: ${knownAppSid || 'none'}`);
    
    // Dynamic import of twilio to avoid server-side issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Format number for Twilio if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Formatted phone number: ${formattedNumber}`);
    
    // Find the Twilio phone number
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Looking up phone number in Twilio account...`);
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Found ${incomingPhoneNumbers.length} matching phone number(s)`);
    
    if (!incomingPhoneNumbers || incomingPhoneNumbers.length === 0) {
      console.error(`[TWILIO UNASSIGN][${new Date().toISOString()}] No phone number found matching ${formattedNumber}`);
      throw new Error(`No Twilio number found matching ${phoneNumber}`);
    }
    
    // Log phone number details
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Phone number details:`, {
      sid: incomingPhoneNumbers[0].sid,
      phoneNumber: incomingPhoneNumbers[0].phoneNumber,
      friendlyName: incomingPhoneNumbers[0].friendlyName,
      smsUrl: incomingPhoneNumbers[0].smsUrl,
      smsMethod: incomingPhoneNumbers[0].smsMethod,
      smsApplicationSid: incomingPhoneNumbers[0].smsApplicationSid || 'none'
    });
    
    const incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;

    // Get the TwiML app SID from the phone number or use the known value
    let twimlAppSid = knownAppSid;
    if (!twimlAppSid) {
      console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] No known app SID, fetching phone number details...`);
      const incomingPhoneNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid).fetch();
      twimlAppSid = incomingPhoneNumber.smsApplicationSid;
      console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Fetched phone details:`, {
        sid: incomingPhoneNumber.sid,
        phoneNumber: incomingPhoneNumber.phoneNumber,
        smsApplicationSid: incomingPhoneNumber.smsApplicationSid || 'none'
      });
    }

    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Found TwiML app SID to remove: ${twimlAppSid || 'No SID attached to phone number'}`);

    // Use empty strings instead of null to clear the ApplicationSid fields
    // Twilio's TypeScript types don't allow null, but empty strings work to clear these values
    const updateParams = {
      smsApplicationSid: '',
      voiceApplicationSid: ''
    };
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Update params for clearing app SIDs:`, updateParams);

    // Clear the webhook URL for SMS and Voice
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Updating phone number to clear app SIDs...`);
    const updatedNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update(updateParams)
      .catch(err => {
        console.error(`[TWILIO UNASSIGN][${new Date().toISOString()}] Error clearing webhook URLs:`, err);
        throw new Error(`Failed to clear webhook URLs: ${err.message}`);
      });
      
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Successfully cleared application SIDs from phone number:`, updatedNumber.phoneNumber);
    console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Updated phone details:`, {
      sid: updatedNumber.sid,
      phoneNumber: updatedNumber.phoneNumber,
      smsApplicationSid: updatedNumber.smsApplicationSid || 'cleared',
      voiceApplicationSid: updatedNumber.voiceApplicationSid || 'cleared'
    });

    // Delete the TwiML app
    if (twimlAppSid) {
      console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] Attempting to delete TwiML app: ${twimlAppSid}`);
      try {
        await client.applications(twimlAppSid).remove();
        console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] TwiML app deleted successfully: ${twimlAppSid}`);
      } catch (err: any) {
        console.error(`[TWILIO UNASSIGN][${new Date().toISOString()}] Failed to delete TwiML app:`, err);
        if (err.code === 20404) {
          // App not found is okay - it might have been deleted already
          console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] App ${twimlAppSid} already deleted or not found`);
        } else {
          throw new Error(`Failed to delete TwiML app: ${err.message}`);
        }
      }
    } else {
      console.log(`[TWILIO UNASSIGN][${new Date().toISOString()}] No TwiML app SID found to delete`);
    }
    
    // Return complete status info
    return {
      phoneNumber: formattedNumber,
      phoneNumberSid: incomingPhoneNumberSid,
      clearedAppSid: twimlAppSid || 'none',
      deletedApp: Boolean(twimlAppSid),
      currentSmsAppSid: updatedNumber.smsApplicationSid || 'none'
    };
  } catch (error: any) {
    console.error(`[TWILIO UNASSIGN][${new Date().toISOString()}] Error updating Twilio webhook:`, error);
    if (error.code) {
      console.error(`[TWILIO UNASSIGN][${new Date().toISOString()}] Twilio error code: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`[TWILIO UNASSIGN][${new Date().toISOString()}] Twilio error info: ${error.moreInfo}`);
    }
    throw error;
  }
}
