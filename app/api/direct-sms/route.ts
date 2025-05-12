import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logTwilioError } from '@/utils/twilio-logger';
import { logOutgoingSms } from '@/utils/sms-monitoring';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { to, message, assistantId } = await request.json();
    
    if (!to || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: "to" and "message" are required' 
      }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      return NextResponse.json({ 
        error: 'Twilio credentials not configured' 
      }, { status: 500 });
    }
    
    // If assistantId is provided, get the assistant's phone number
    let from = process.env.TWILIO_PHONE_NUMBER; // Default phone number
    
    if (assistantId) {
      try {
        const { data: assistant } = await supabase
          .from('assistants')
          .select('id, name, assigned_phone_number')
          .eq('id', assistantId)
          .single();
          
        if (assistant?.assigned_phone_number) {
          from = assistant.assigned_phone_number;
        }
      } catch (error) {
        console.warn('Failed to get No-Show phone number, using default');
      }
    }
    
    if (!from) {
      return NextResponse.json({ 
        error: 'No phone number available to send from' 
      }, { status: 400 });
    }
    
    try {
      // Import Twilio SDK
      const twilio = await import('twilio');
      const client = twilio.default(accountSid, authToken);
      
      // Log the outgoing SMS
      logOutgoingSms(to, from, message);
      
      // Send directly via Twilio API
      console.log(`Sending direct SMS from ${from} to ${to}: ${message.substring(0, 50)}...`);
      const result = await client.messages.create({
        body: message,
        from: from,
        to: to
      });
      
      console.log(`SMS sent with SID: ${result.sid}, status: ${result.status}`);
      
      // Return success with message details
      return NextResponse.json({
        success: true,
        messageSid: result.sid,
        status: result.status,
        from,
        to
      });
    } catch (twilioError: any) {
      console.error('Twilio API error:', twilioError);
      logTwilioError('DirectSMS', 'Error sending SMS via Twilio API', twilioError);
      
      return NextResponse.json({ 
        error: `Twilio API error: ${twilioError.message || 'Unknown error'}`,
        code: twilioError.code,
        status: twilioError.status 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in direct-sms endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Endpoint to check status of a sent message
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const messageSid = url.searchParams.get('sid');
    
    if (!messageSid) {
      return NextResponse.json({ 
        error: 'Missing required parameter: "sid"' 
      }, { status: 400 });
    }
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      return NextResponse.json({ 
        error: 'Twilio credentials not configured' 
      }, { status: 500 });
    }
    
    try {
      // Import Twilio SDK
      const twilio = await import('twilio');
      const client = twilio.default(accountSid, authToken);
      
      // Fetch message status
      const message = await client.messages(messageSid).fetch();
      
      return NextResponse.json({
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      });
    } catch (twilioError: any) {
      console.error('Error checking message status:', twilioError);
      return NextResponse.json({ 
        error: `Twilio API error: ${twilioError.message || 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in direct-sms status endpoint:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
