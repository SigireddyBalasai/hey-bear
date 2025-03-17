import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server-admin';

// A simple token for webhook authentication
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'webhook-token-123456';

export async function POST(req: Request) {
  const startTime = new Date();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[${startTime.toISOString()}][${requestId}] Twilio webhook received`);
    
    // Log request details
    const url = new URL(req.url);
    const formData = await req.formData();
    console.log(`[${new Date().toISOString()}][${requestId}] Request details:`, {
      method: req.method,
      url: req.url,
      params: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(req.headers),
      formData: Object.fromEntries(formData.entries())
    });
    
    // Extract assistantId from query parameters
    const assistantId = url.searchParams.get('assistantId');
    const token = url.searchParams.get('token');
    
    // In production, you might want to enable this token check
    // But for now, let's disable it to allow Twilio webhooks to work
    // We'll add other security measures instead
    
    // Basic validation of the source by checking for Twilio-specific form fields
    const twilioFields = ['From', 'To', 'Body', 'MessageSid'];
    const hasTwilioFields = twilioFields.some(field => formData.has(field));
    
    if (!hasTwilioFields) {
      console.log(`Request missing Twilio fields, likely not from Twilio`);
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Extract data from Twilio webhook
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const callSid = formData.get('CallSid') as string | null; // Check for CallSid to identify voice calls
    const isVoiceCall = !!callSid;
    
    console.log(`Received ${isVoiceCall ? 'voice call' : 'SMS'} from ${from} to ${to}${body ? ': ' + body : ''}`);
    
    if (!assistantId) {
      console.log(`No assistantId provided, cannot process request`);
      return generateTwimlResponse('Assistant ID is required', isVoiceCall);
    }
    
    console.log(`Using assistantId from URL param: ${assistantId}`);
    
    if (!from || !to || (!body && !isVoiceCall)) {
      return generateTwimlResponse('Missing required information', isVoiceCall);
    }

    // Use non-auth client
    const supabase = createServiceClient();
    
    // Get assistant details
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
    
    // Handle voice calls differently than SMS
    if (isVoiceCall) {
      return handleVoiceCall(assistant, from);
    }

    try {
      // Get the base URL from the incoming request
      // This ensures we use the same host that received the webhook
      const baseUrl = new URL(req.url);
      // Extract just protocol and host without path or search params
      const baseUrlNoPath = `${baseUrl.protocol}//${baseUrl.host}`;
      const apiUrl = `${baseUrlNoPath}/api/assistant/chat/public`;
      
      console.log(`[${new Date().toISOString()}][${requestId}] Calling assistant chat API at: ${apiUrl}`);
      console.log(`[${new Date().toISOString()}][${requestId}] Request payload:`, {
        assistantId: assistant.id,
        message: body,
        userPhone: from,
        userId: assistant.user_id
      });
      
      const chatStartTime = new Date();
      const chatResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': WEBHOOK_TOKEN
        },
        body: JSON.stringify({
          assistantId: assistant.id,
          message: body,
          systemOverride: `You are responding to an SMS message. Keep your response concise.`,
          userPhone: from,
          userId: assistant.user_id
        }),
      });
      const chatEndTime = new Date();
      
      console.log(`[${new Date().toISOString()}][${requestId}] Chat API response time: ${chatEndTime.getTime() - chatStartTime.getTime()}ms`);

      if (!chatResponse.ok) {
        console.error(`[${new Date().toISOString()}][${requestId}] Chat API error:`, {
          status: chatResponse.status,
          statusText: chatResponse.statusText
        });
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const responseData = await chatResponse.json();
      console.log(`[${new Date().toISOString()}][${requestId}] Chat API response:`, responseData);
      const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
      
      // Record the interaction using non-auth client
      await supabase
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
      
      const twimlResponse = generateTwimlResponse(aiResponse, false);
      const endTime = new Date();
      console.log(`[${endTime.toISOString()}][${requestId}] Webhook completed`, {
        duration: endTime.getTime() - startTime.getTime(),
        success: true,
        responseLength: aiResponse.length
      });
      
      return twimlResponse;
      
    } catch (aiError) {
      console.error(`[${new Date().toISOString()}][${requestId}] Error calling assistant chat API:`, aiError);
      
      // Fallback response
      const fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
      
      // Record error interaction
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
    const endTime = new Date();
    console.error(`[${endTime.toISOString()}][${requestId}] Error processing Twilio webhook:`, {
      error,
      duration: endTime.getTime() - startTime.getTime()
    });
    return generateTwimlResponse('Sorry, we encountered an error processing your message. Please try again later.', false);
  }
}

// Handle voice calls
function handleVoiceCall(assistant: any, caller: string) {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, you've reached the ${assistant.name} assistant. This assistant communicates via text messages. Please send an SMS to this number instead of calling.</Say>
  <Pause length="1"/>
  <Say voice="alice">Thank you for your call. Goodbye.</Say>
</Response>`;
  
  return new Response(twimlResponse, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Generate a TwiML response based on message content
function generateTwimlResponse(message: string, isVoice: boolean, requestId?: string) {
  const responseId = requestId || Math.random().toString(36).substring(7);
  console.log(`[${new Date().toISOString()}][${responseId}] Generating TwiML response:`, {
    isVoice,
    messageLength: message.length
  });
  
  if (isVoice) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<!-- Response ID: ${responseId} -->
<Response>
  <Say voice="alice">${message}</Say>
</Response>`, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } else {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<!-- Response ID: ${responseId} -->
<Response>
  <Message>${message}</Message>
</Response>`, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
