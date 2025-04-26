import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/lib/db.types';
import twilio from 'twilio';

export async function POST(req: Request) {
  try {
    const { to, message, assistantId } = await req.json();
    
    if (!to || !message || !assistantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Find the assistant
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, name, user_id, assigned_phone_number')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistant) {
      console.error('No-Shows not found:', assistantId, assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }
    
    if (!assistant.assigned_phone_number) {
      return NextResponse.json({ error: 'This No-Shows does not have an assigned phone number' }, { status: 400 });
    }
    
    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }
    
    const client = twilio(accountSid, authToken);
    
    // Send the message using the Twilio API
    const twilioResponse = await client.messages.create({
      body: message,
      from: assistant.assigned_phone_number,
      to: to
    });
    
    // Record the interaction
    await supabase
      .from('interactions')
      .insert({
        user_id: assistant.user_id,
        assistant_id: assistant.id,
        request: 'SMS outbound',
        response: message,
        chat: JSON.stringify({ from: assistant.assigned_phone_number, to, body: message }),
        interaction_time: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      messageId: twilioResponse.sid,
      status: twilioResponse.status
    });
    
  } catch (error: any) {
    console.error('Error sending SMS via Twilio:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send SMS'
    }, { status: 500 });
  }
}
