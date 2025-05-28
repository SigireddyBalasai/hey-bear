import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logSMSMessage, updateSMSStatus } from '@/utils/sms-monitoring';
import twilio from 'twilio';

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

    // Initialize Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    let from = process.env.TWILIO_PHONE_NUMBER;
    
    if (assistantId) {
      try {
        const { data: assistant } = await supabase
          .schema('assistants')
          .from('assistants')
          .select('id, name, assigned_phone_number')
          .eq('id', assistantId)
          .single();
          
        if (assistant?.assigned_phone_number) {
          from = assistant.assigned_phone_number;
        }
      } catch {
        console.warn('Failed to get assistant phone number, using default');
      }
    }
    
    if (!from) {
      return NextResponse.json({ 
        error: 'No phone number available to send from' 
      }, { status: 400 });
    }

    try {
      // Generate a unique message ID for tracking
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Log the outgoing SMS
      await logSMSMessage({
        messageId,
        fromNumber: from,
        toNumber: to,
        message: message,
        direction: 'outgoing',
        status: 'pending',
        timestamp: new Date().toISOString(),
        assistantId,
        userId: user.id
      });
      
      // Send message using real Twilio client
      const result = await twilioClient.messages.create({
        body: message,
        from: from,
        to: to
      });
      
      // Update SMS log with actual SID and status
      await updateSMSStatus(messageId, result.status);

      console.log(`SMS sent with SID: ${result.sid}, status: ${result.status}`);
      
      // Return success with message details
      return NextResponse.json({
        success: true,
        messageSid: result.sid,
        status: result.status,
        from,
        to
      });
    } catch (error: unknown) {
      console.error('Mock Twilio error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: `Error sending SMS: ${errorMessage}`
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Error in direct SMS endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Server error: ${errorMessage}`
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
    
    // For mock implementation, just return a success status
    return NextResponse.json({
      success: true,
      sid: messageSid,
      status: 'delivered',
      dateCreated: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      dateUpdated: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Error checking message status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Server error: ${errorMessage}`
    }, { status: 500 });
  }
}
