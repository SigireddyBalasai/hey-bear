import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logTwilio, logTwilioError, formatTwilioWebhook, logTwimlResponse } from '@/utils/twilio-logger';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio webhook received`);
  
  try {
    // Extract assistantId from query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    const token = url.searchParams.get('token'); // Optional verification token
    const isVoiceParam = url.searchParams.get('isVoice'); // Check explicit voice parameter
    
    console.log(`Request URL: ${req.url}`);
    console.log(`Query parameters: ${JSON.stringify(Object.fromEntries(url.searchParams))}`);
    
    const formData = await req.formData();
    console.log(`Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    
    // Extract data from Twilio webhook
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const callSid = formData.get('CallSid') as string | null; // Check for CallSid to identify voice calls
    
    // Determine if this is a voice call - either from CallSid or explicit URL parameter
    const isVoiceCall = !!callSid || isVoiceParam === 'true';
    
    console.log(`Received ${isVoiceCall ? 'voice call' : 'SMS'} from ${from} to ${to}`);
    if (body) {
      console.log(`Message content: "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`);
    }
    if (callSid) {
      console.log(`Call SID: ${callSid}`);
    }
    
    // Optional token verification - can be enabled in a production environment
    if (process.env.VERIFY_WEBHOOK_TOKEN === 'true' && token !== process.env.WEBHOOK_TOKEN) {
      console.error('Invalid webhook token');
      return generateTwimlResponse('Unauthorized webhook access', isVoiceCall);
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
      logTwilio('Webhook', `Handling voice call for assistant ${assistantId}`);
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
  logTwilio('VoiceCall', `Handling voice call from ${caller} to ${to} for assistant: ${assistant.name}`);
  
  try {
    // Parse the base URL to ensure we're using the right domain
    const parsedUrl = new URL(baseUrl);
    
    // Create a callback URL for the voice transcription
    const callbackUrl = new URL('/api/twilio/voice-transcription', parsedUrl.origin);
    callbackUrl.searchParams.set('assistantId', assistantId);
    callbackUrl.searchParams.set('from', caller);
    callbackUrl.searchParams.set('to', to);
    
    console.log(`Setting voice callback URL: ${callbackUrl.toString()}`);
    logTwilio('VoiceCall', `Setting voice transcription callback URL: ${callbackUrl.toString()}`);
    
    // Generate a more natural-sounding greeting that flows directly into listening
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, this is ${assistant.name}. How can I help you today?</Say>
  <Gather input="speech" action="${callbackUrl.toString()}" speechTimeout="auto" language="en-US" enhanced="true" speechModel="phone_call">
  </Gather>
  <Say voice="alice">I didn't hear anything. Please call again if you'd like to speak with me. Goodbye.</Say>
</Response>`;
    
    logTwilio('VoiceCall', `Generated welcome TwiML for assistant: ${assistant.name}`);
    logTwimlResponse(twimlResponse);
    
    return new Response(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    logTwilioError('VoiceCall', 'Error generating voice TwiML', error);
    // Simplified fallback response if anything fails
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, I'm having trouble connecting to the assistant. Please try again later.</Say>
</Response>`;
    
    return new Response(fallbackTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

// Generate a TwiML response based on message content
function generateTwimlResponse(message: string, isVoice: boolean) {
  console.log(`Generating ${isVoice ? 'voice' : 'SMS'} TwiML response`);
  
  try {
    // Sanitize the message for TwiML
    const sanitizedMessage = sanitizeMessage(message);
    
    let twimlResponse;
    if (isVoice) {
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizedMessage}</Say>
</Response>`;
    } else {
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizedMessage}</Message>
</Response>`;
    }
    
    console.log(`TwiML response: ${twimlResponse.replace(/\n/g, ' ')}`);
    return new Response(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error(`Error generating ${isVoice ? 'voice' : 'SMS'} TwiML:`, error);
    
    // Fallback response
    const fallbackResponse = isVoice ?
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Sorry, there was an error generating a response.</Say></Response>` :
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, there was an error generating a response.</Message></Response>`;
      
    return new Response(fallbackResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

// Sanitize message for XML
function sanitizeMessage(message: string): string {
  if (!message) return "Sorry, no response was generated.";
  
  try {
    // For voice, replace problematic characters to improve TTS
    if (message.length > 1600) {
      message = message.substring(0, 1597) + '...';
    }
    
    return message
      .replace(/&/g, 'and')  // Replace & with 'and' for better TTS
      .replace(/</g, '')     // Remove < completely
      .replace(/>/g, '')     // Remove > completely
      .replace(/"/g, '')     // Remove quotes completely
      .replace(/'/g, '')     // Remove apostrophes completely
      .replace(/[^\w\s.,?!;:()\-]/g, ''); // Only allow safe characters
  } catch (error) {
    console.error('Error sanitizing message:', error);
    return "Sorry, there was an error processing the response.";
  }
}
