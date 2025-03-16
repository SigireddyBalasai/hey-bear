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
    const { assistantId, phoneNumber, webhook } = await request.json();
    console.log(`[${new Date().toISOString()}] Phone Number Assignment - Request body:`, { assistantId, phoneNumber, webhook });
    
    // Validate required fields
    if (!assistantId || !phoneNumber) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Missing fields`);
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Validate webhook URL if provided
    let webhookUrl = webhook || null;
    if (webhookUrl && !isValidURL(webhookUrl)) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Invalid webhook URL`);
      return NextResponse.json(
        { error: 'Invalid webhook URL format' }, 
        { status: 400 }
      );
    }
    
    // Check if phone number exists and is not assigned
    const { data: phoneNumberData, error: phoneNumberError } = await supabase
      .from('phonenumbers')
      .select('*')
      .eq('number', phoneNumber);
    
    if (phoneNumberError) {
      console.error(`[${new Date().toISOString()}] Phone number query error:`, phoneNumberError);
      return NextResponse.json(
        { error: `Database error: ${phoneNumberError.message}` }, 
        { status: 500 }
      );
    }
    
    if (!phoneNumberData || phoneNumberData.length === 0) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Number not found: ${phoneNumber}`);
      return NextResponse.json(
        { error: 'Phone number does not exist in the system' }, 
        { status: 404 }
      );
    }

    // Get phone number record
    const phoneNumberRecord = phoneNumberData[0];
    console.log(`[${new Date().toISOString()}] Phone Number Assignment - Phone number record:`, phoneNumberRecord);
    
    // Check if it's already assigned to another assistant (combining queries)
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('id, name, assigned_phone_number')
      .or(`id.eq.${assistantId},assigned_phone_number.eq.${phoneNumber}`)
      
    if (assistantError) {
      console.error(`[${new Date().toISOString()}] Assistant query error:`, assistantError);
      return NextResponse.json(
        { error: `Assistant query error: ${assistantError.message}` }, 
        { status: 500 }
      );
    }
    
    // Check if the assistant exists
    const targetAssistant = assistantData?.find(a => a.id === assistantId);
    if (!targetAssistant) {
      console.log(`[${new Date().toISOString()}] Assistant not found: ${assistantId}`);
      return NextResponse.json(
        { error: 'Assistant not found' }, 
        { status: 404 }
      );
    }
    
    // Check if phone number is already assigned to another assistant
    const phoneAssignedToOther = assistantData?.find(a => a.id !== assistantId && a.assigned_phone_number === phoneNumber);
    if (phoneAssignedToOther) {
      console.log(`[${new Date().toISOString()}] Phone number already assigned to assistant: ${phoneAssignedToOther.name}`);
      return NextResponse.json({
        error: `Phone number is already assigned to assistant: ${phoneAssignedToOther.name}`,
        status: 409
      });
    }
    
    // If the assistant already has this phone number assigned, just return success
    if (targetAssistant.assigned_phone_number === phoneNumber) {
      console.log(`[${new Date().toISOString()}] Phone number already assigned to this assistant`);
      return NextResponse.json({
        success: true,
        message: 'Phone number already assigned to this assistant',
      });
    }
      
    // Use a transaction to ensure data consistency
    const { error: transactionError } = await supabase.rpc('assign_phone_number', { 
      p_assistant_id: assistantId,
      p_phone_number: phoneNumber,
      p_phone_number_id: phoneNumberRecord.id
    });
    
    if (transactionError) {
      console.error(`[${new Date().toISOString()}] Transaction error:`, transactionError);
      return NextResponse.json(
        { error: `Failed to assign phone number: ${transactionError.message}` }, 
        { status: 500 }
      );
    }
    
    // If webhook URL is provided, update Twilio
    if (webhookUrl) {
      // Ensure the webhook URL contains the assistant ID
      const webhookURL = new URL(webhookUrl);
      if (!webhookURL.searchParams.has('assistantId')) {
        webhookURL.searchParams.set('assistantId', assistantId);
        webhookUrl = webhookURL.toString();
      }
      
      try {
        // Update Twilio webhook if SMS provider is configured
        if (process.env.SMS_PROVIDER === 'twilio') {
          console.log(`[${new Date().toISOString()}] Updating Twilio webhook...`);
          await updateTwilioWebhook(phoneNumber, webhookUrl);
          console.log(`[${new Date().toISOString()}] Successfully updated Twilio webhook`);
        }
      } catch (smsError: any) {
        console.error(`[${new Date().toISOString()}] SMS provider error:`, smsError);
      }
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] Phone Number Assignment - END - Duration: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Phone number assigned successfully'
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Phone Number Assignment - ERROR:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// Helper function to validate URL format
function isValidURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
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

    // Create TwiML App
    const twimlApp = await client.applications.create({
      friendlyName: `HeyBear Assistant - ${phoneNumber}`,
      smsUrl: webhookUrl,
      voiceUrl: webhookUrl,
      smsMethod: 'POST',
      voiceMethod: 'POST'
    } as any).catch(err => {
      throw new Error(`Failed to create Twilio application: ${err.message}`);
    });

    // Update the phone number with the TwiML app SID
    await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update({
        smsApplicationSid: twimlApp.sid,
        voiceApplicationSid: twimlApp.sid
      });
  } catch (error) {
    console.error('Error updating Twilio webhook:', error);
    throw error;
  }
}
