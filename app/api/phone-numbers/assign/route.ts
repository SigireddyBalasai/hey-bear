import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { Tables } from '@/lib/db.types';

export async function POST(request: Request) {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Phone Number Assignment - START`);
  
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Unauthorized request`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[${new Date().toISOString()}] Phone Number Assignment - User authenticated: ${user.id}`);

    // Parse the request body
    const { assistantId, phoneNumber, webhook, webhookUrl } = await request.json();
    // Use webhookUrl if provided, otherwise fall back to webhook
    const finalWebhookUrl = webhookUrl || webhook;
    
    console.log(`[${new Date().toISOString()}] Phone Number Assignment - Request body:`, { 
      assistantId, 
      phoneNumber, 
      webhookUrl: finalWebhookUrl 
    });
    
    // Validate required fields
    if (!assistantId || !phoneNumber) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Missing fields`);
      return NextResponse.json(
        { error: 'Missing required fields: assistantId and phoneNumber are required' }, 
        { status: 400 }
      );
    }

    // Validate webhook URL if provided
    if (!finalWebhookUrl) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Missing webhook URL`);
      return NextResponse.json(
        { error: 'Webhook URL is required for Twilio integration' }, 
        { status: 400 }
      );
    }
    
    if (!isValidURL(finalWebhookUrl)) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Invalid webhook URL`);
      return NextResponse.json(
        { error: 'Invalid webhook URL format' }, 
        { status: 400 }
      );
    }
    
    // Check if assistant exists
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('id, assigned_phone_number')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Assistant not found`);
      return NextResponse.json(
        { error: 'Assistant not found' }, 
        { status: 404 }
      );
    }
    
    // Check if assistant already has a phone number
    if (assistantData.assigned_phone_number) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Assistant already has a phone number`);
      return NextResponse.json(
        { error: 'Assistant already has a phone number assigned' }, 
        { status: 400 }
      );
    }
    
    // Get the phone number record
    const { data: phoneNumberData, error: phoneNumberError } = await supabase
      .from('phonenumbers')
      .select('*')
      .eq('number', phoneNumber)
      .single();
    
    if (phoneNumberError || !phoneNumberData) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Phone number not found in database`);
      return NextResponse.json(
        { error: 'Phone number not found in database' }, 
        { status: 404 }
      );
    }
    
    // Check if phone number is already assigned
    if (phoneNumberData.is_assigned) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Phone number already assigned`);
      return NextResponse.json(
        { error: 'Phone number is already assigned to an assistant' }, 
        { status: 400 }
      );
    }
    
    // 1. Create and configure TwiML app if using Twilio or other SMS provider
    let twimlAppSid: string | null = null;
    try {
      if (process.env.SMS_PROVIDER === 'twilio') {
        console.log(`[${new Date().toISOString()}] Phone Number Assignment - Creating and configuring Twilio TwiML app...`);
        console.log(`[${new Date().toISOString()}] Phone Number Assignment - Using webhook URL: ${finalWebhookUrl}`);
        twimlAppSid = await createAndConfigureTwilioTwiMLApp(phoneNumber, finalWebhookUrl);
        console.log(`[${new Date().toISOString()}] Phone Number Assignment - Successfully created and configured Twilio TwiML app with SID: ${twimlAppSid}`);
      }
      // Other SMS providers could be added here
    } catch (smsError: any) {
      console.error(`[${new Date().toISOString()}] Phone Number Assignment - SMS provider error:`, smsError);
      return NextResponse.json(
        { error: `Failed to configure SMS provider: ${smsError.message}` }, 
        { status: 500 }
      );
    }
    
    // 2. Update phone number as assigned
    const { error: updatePhoneError } = await supabase
      .from('phonenumbers')
      .update({ 
        is_assigned: true,
        twilio_app_sid: twimlAppSid
      })
      .eq('number', phoneNumber);
    
    if (updatePhoneError) {
      console.error(`[${new Date().toISOString()}] Phone Number Assignment - Update phone error:`, updatePhoneError);
      
      // Clean up the TwiML app if it was created
      if (twimlAppSid) {
        try {
          await cleanupTwilioTwiMLApp(phoneNumber, twimlAppSid);
        } catch (cleanupError) {
          console.error("Failed to clean up TwiML app:", cleanupError);
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to assign phone number' }, 
        { status: 500 }
      );
    }
    
    // 3. Update assistant with phone number
    const { error: updateAssistantError } = await supabase
      .from('assistants')
      .update({ assigned_phone_number: phoneNumber })
      .eq('id', assistantId);
    
    if (updateAssistantError) {
      console.error(`[${new Date().toISOString()}] Phone Number Assignment - Update assistant error:`, updateAssistantError);
      
      // Revert phone number assignment
      try {
        await supabase
          .from('phonenumbers')
          .update({ 
            is_assigned: false,
            twilio_app_sid: null
          })
          .eq('number', phoneNumber);
      } catch (revertError) {
        console.error("Failed to revert phone number assignment:", revertError);
      }
      
      // Clean up the TwiML app if it was created
      if (twimlAppSid) {
        try {
          await cleanupTwilioTwiMLApp(phoneNumber, twimlAppSid);
        } catch (cleanupError) {
          console.error("Failed to clean up TwiML app:", cleanupError);
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to update assistant record' }, 
        { status: 500 }
      );
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] Phone Number Assignment - END - Duration: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Phone number assigned successfully',
      data: {
        phoneNumber,
        assistantId,
        twimlAppSid
      }
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Phone Number Assignment - ERROR:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// Function to create and configure Twilio TwiML app
async function createAndConfigureTwilioTwiMLApp(phoneNumber: string, webhookUrl: string): Promise<string> {
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
    
    // Create a new TwiML Application for SMS handling
    const friendlyName = `SMS Handler for ${phoneNumber}`;
    console.log(`[${new Date().toISOString()}] Creating new TwiML app: ${friendlyName}`);
    
    const newTwiMLApp = await client.applications.create({
      friendlyName: friendlyName,
      smsUrl: webhookUrl,
      smsMethod: 'POST'
    });
    
    console.log(`[${new Date().toISOString()}] Created TwiML app with SID: ${newTwiMLApp.sid}`);
    
    // Assign the TwiML app to the phone number
    await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update({
        smsApplicationSid: newTwiMLApp.sid
      });
    
    console.log(`[${new Date().toISOString()}] Assigned TwiML app to phone number ${phoneNumber}`);
    
    return newTwiMLApp.sid;
  } catch (error: any) {
    console.error('Error configuring Twilio webhook:', error);
    throw new Error(`Twilio configuration failed: ${error.message}`);
  }
}

// Function to clean up Twilio TwiML app in case of errors
async function cleanupTwilioTwiMLApp(phoneNumber: string, twimlAppSid: string): Promise<void> {
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
    
    if (incomingPhoneNumbers && incomingPhoneNumbers.length > 0) {
      const incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;
      
      // Clear the TwiML app from the phone number
      await client.incomingPhoneNumbers(incomingPhoneNumberSid)
        .update({
          smsApplicationSid: ''
        });
      
      console.log(`[${new Date().toISOString()}] Cleared TwiML app from phone number ${phoneNumber}`);
    }
    
    // Delete the TwiML app
    await client.applications(twimlAppSid).remove();
    console.log(`[${new Date().toISOString()}] Deleted TwiML app with SID: ${twimlAppSid}`);
  } catch (error) {
    console.error('Error cleaning up Twilio resources:', error);
    throw error;
  }
}

// Function to update Twilio webhook (for unassignment - kept from original code)
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

    console.log('Found TwiML app SID:', twimlAppSid);

    // Use empty strings instead of null to clear the ApplicationSid fields
    // Twilio's TypeScript types don't allow null, but empty strings work to clear these values
    const updateParams = {
      smsApplicationSid: '',
      voiceApplicationSid: ''
    };

    // Clear the webhook URL for SMS and Voice
    await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update(updateParams)
      .catch(err => {
        throw new Error(`Failed to clear webhook URLs: ${err.message}`);
      });
      
    console.log('Cleared application SIDs from phone number');

    // Delete the TwiML app
    if (twimlAppSid) {
      console.log('Attempting to delete TwiML app:', twimlAppSid);
      await client.applications(twimlAppSid).remove()
        .catch(err => {
          throw new Error(`Failed to delete TwiML app: ${err.message}`);
        });
      console.log('TwiML app deleted successfully');
    }
  } catch (error) {
    console.error('Error updating Twilio webhook:', error);
    throw error;
  }
}
function isValidURL(url: string): boolean {
  try {
    // Check if URL is valid using URL constructor
    const parsedUrl = new URL(url);
    // Make sure the protocol is http or https
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    // URL constructor will throw if given an invalid URL
    return false;
  }
}
