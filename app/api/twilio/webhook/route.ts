import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  console.log(`[${new Date().toISOString()}] Twilio webhook received`);
  
  try {
    // Extract assistantId from query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    
    const formData = await req.formData();
    
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

    const supabase = await createClient();
    
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
      const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/assistant/chat`;
      
      console.log(`Calling assistant chat API at: ${apiUrl}`);
      
      // Send the request to the chat endpoint using the current host
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

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const responseData = await chatResponse.json();
      const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
      
      // Record the interaction
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
      
      return generateTwimlResponse(aiResponse, false);
      
    } catch (aiError) {
      console.error('Error calling assistant chat API:', aiError);
      
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
    console.error('Error processing Twilio webhook:', error);
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
function generateTwimlResponse(message: string, isVoice: boolean) {
  if (isVoice) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
</Response>`, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } else {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
