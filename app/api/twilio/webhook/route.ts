import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio webhook received`);
  
  try {
    // Extract assistantId from query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    console.log(`Request URL: ${req.url}`);
    console.log(`Query parameters: ${JSON.stringify(Object.fromEntries(url.searchParams))}`);
    
    const formData = await req.formData();
    console.log(`Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    
    // Extract data from Twilio webhook
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const callSid = formData.get('CallSid') as string | null; // Check for CallSid to identify voice calls
    const isVoiceCall = !!callSid;
    
    console.log(`Received ${isVoiceCall ? 'voice call' : 'SMS'} from ${from} to ${to}`);
    if (body) {
      console.log(`Message content: "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`);
    }
    if (callSid) {
      console.log(`Call SID: ${callSid}`);
    }
    
    if (!assistantId) {
      console.log(`No assistantId provided, cannot process request`);
      return generateTwimlResponse('Assistant ID is required', isVoiceCall);
    }
    
    console.log(`Using assistantId from URL param: ${assistantId}`);
    
    if (!from || !to || (!body && !isVoiceCall)) {
      console.error('Missing required information:', { from: !!from, to: !!to, body: !!body || isVoiceCall });
      return generateTwimlResponse('Missing required information', isVoiceCall);
    }

    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Get assistant details
    console.log(`Fetching assistant with ID: ${assistantId}`);
    const { data: assistant, error } = await supabase
      .from('assistants')
      .select(`
        id,
        name,
        user_id,
        assigned_phone_number
      `)
      .eq('id', assistantId)
      .single();
    
    if (error || !assistant) {
      console.error('Error fetching assistant by ID:', error);
      return generateTwimlResponse('Assistant not found', isVoiceCall);
    }
    
    console.log(`Found assistant: ${assistant.name} (ID: ${assistant.id})`);
    
    // Handle voice calls differently than SMS
    if (isVoiceCall) {
      console.log('Handling as voice call');
      return handleVoiceCall(assistant, from, to, url.toString(), assistantId);
    }

    try {
      // Get the base URL from the incoming request
      // This ensures we use the same host that received the webhook
      const baseUrl = new URL(req.url);
      const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/assistant/chat`;
      
      console.log(`Calling assistant chat API at: ${apiUrl}`);
      console.log(`Request payload: ${JSON.stringify({
        assistantId: assistant.id,
        message: body,
        systemOverride: `You are responding to an SMS message. Keep your response concise.`,
        userPhone: from
      })}`);
      
      // Send the request to the chat endpoint using the current host
      const chatStartTime = Date.now();
      const chatResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistant.id,
          message: body,
          systemOverride: `You are responding to an SMS message. Keep your response concise.`,
          userPhone: from
        }),
      });
      const chatEndTime = Date.now();
      console.log(`Chat API response time: ${chatEndTime - chatStartTime}ms`);
      console.log(`Chat API response status: ${chatResponse.status}`);

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text().catch(() => 'No error details');
        console.error(`Chat API error response: ${errorText}`);
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const responseData = await chatResponse.json();
      console.log(`Chat API response data: ${JSON.stringify(responseData)}`);
      const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
      console.log(`AI response: "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`);
      
      // Record the interaction
      console.log('Saving interaction to database');
      const { error: insertError } = await supabase
        .from('interactions')
        .insert({
          user_id: assistant.user_id,
          assistant_id: assistant.id,
          request: body,
          response: aiResponse,
          chat: JSON.stringify({ from, to, body }),
          interaction_time: new Date().toISOString(),
          token_usage: responseData.tokens || null,
          input_tokens: responseData.usage?.promptTokens || null,
          output_tokens: responseData.usage?.completionTokens || null,
          cost_estimate: responseData.cost || null,
          duration: responseData.timing?.responseDuration || null
        });
      
      if (insertError) {
        console.error('Error saving interaction:', insertError);
      } else {
        console.log('Interaction saved successfully');
      }
      
      console.log('Generating TwiML response');
      return generateTwimlResponse(aiResponse, false);
      
    } catch (aiError) {
      console.error('Error calling assistant chat API:', aiError);
      
      // Fallback response
      const fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
      console.log(`Using fallback response: "${fallbackResponse}"`);
      
      // Record error interaction
      console.log('Recording error interaction');
      await supabase
        .from('interactions')
        .insert({
          user_id: assistant.user_id,
          assistant_id: assistant.id,
          request: body,
          response: fallbackResponse,
          chat: JSON.stringify({ from, to, body }),
          interaction_time: new Date().toISOString(),
          is_error: true
        });
      
      return generateTwimlResponse(fallbackResponse, false);
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return generateTwimlResponse('Sorry, we encountered an error processing your message. Please try again later.', false);
  }
}

// Handle voice calls with speech recognition
function handleVoiceCall(assistant: any, caller: string, to: string, baseUrl: string, assistantId: string) {
  console.log(`Generating voice response for caller: ${caller}`);
  
  // Create a callback URL for the voice transcription
  const callbackUrl = new URL('/api/twilio/voice-transcription', baseUrl);
  callbackUrl.searchParams.set('assistantId', assistantId);
  callbackUrl.searchParams.set('from', caller);
  callbackUrl.searchParams.set('to', to);
  
  console.log(`Setting voice callback URL: ${callbackUrl.toString()}`);
  
  // Generate TwiML that prompts the user and records their voice
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, you've reached ${assistant.name}. How can I help you today?</Say>
  <Gather input="speech" action="${callbackUrl.toString()}" speechTimeout="auto" language="en-US" enhanced="true" speechModel="phone_call">
    <Say voice="alice">Please speak after the tone.</Say>
  </Gather>
  <Say voice="alice">I didn't hear anything. Please call again if you'd like to speak with the assistant. Goodbye.</Say>
</Response>`;
  
  console.log(`Voice TwiML response: ${twimlResponse.replace(/\n/g, ' ')}`);
  return new Response(twimlResponse, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Generate a TwiML response based on message content
function generateTwimlResponse(message: string, isVoice: boolean) {
  console.log(`Generating ${isVoice ? 'voice' : 'SMS'} TwiML response`);
  
  let twimlResponse;
  if (isVoice) {
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizeMessage(message)}</Say>
</Response>`;
  } else {
    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizeMessage(message)}</Message>
</Response>`;
  }
  
  console.log(`TwiML response: ${twimlResponse.replace(/\n/g, ' ')}`);
  return new Response(twimlResponse, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Sanitize message for XML
function sanitizeMessage(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
