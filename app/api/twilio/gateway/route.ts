import type { ChatAPIResponse } from '@/types/api.types';
import { sanitizeForSms } from '@/utils/string-utils';
import { createClient } from '@/utils/supabase/server-admin';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Twilio gateway webhook received`);

  try {
    // Parse and validate request
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    const formData = await req.formData();

    // Log incoming request details
    console.log(`Request URL: ${req.url}`);
    console.log(`Form data keys: ${[...formData.keys()].join(', ')}`);

    // Determine if this is SMS or Voice
    const messageBody = formData.get('Body') as string;
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    // Route to appropriate handler
    if (messageBody) {
      // Handle SMS
      return await handleSMS(assistantId, from, to, messageBody, req);
    } else if (callSid) {
      // Handle Voice Call
      return await handleVoiceCall(assistantId, from, to, callSid, speechResult, req);
    }
    console.error('Unknown webhook type - no Body or CallSid found');

    return generateErrorResponse();
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);

    return generateErrorResponse();
  }
}

async function handleSMS(
  assistantId: string | null,
  from: string,
  to: string,
  messageBody: string,
  req: Request
) {
  console.log(`Handling SMS from ${from} to ${to}: "${messageBody}"`);

  if (!assistantId) {
    console.log('No assistant ID provided for SMS');

    return generateSMSResponse('Assistant ID is required');
  }

  if (!from || !to || !messageBody) {
    console.error('Missing required SMS information:', {
      from: Boolean(from),
      to: Boolean(to),
      messageBody: Boolean(messageBody),
    });

    return generateSMSResponse('Missing required information');
  }

  const supabase = await createClient();

  // Get assistant details
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('id', assistantId)
    .single();

  if (!assistant) {
    console.error('Assistant not found:', error);

    return generateSMSResponse('Assistant not found');
  }

  console.log(`Processing SMS for assistant: ${assistant.name}`);

  try {
    // Call the chat API
    const baseUrl = new URL(req.url);
    const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/Concierge/chat`;

    const chatPayload = {
      assistantId: assistant.id,
      message: messageBody,
      systemOverride:
        'You are responding to an SMS message. Keep your response concise and under 1600 characters.',
      userPhone: from,
    };

    const chatResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
      cache: 'no-store',
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${chatResponse.status}`);
    }

    const responseData = (await chatResponse.json()) as ChatAPIResponse;
    const aiResponse = responseData.response ?? "I'm sorry, I couldn't generate a response.";

    // Record the interaction
    await supabase.from('interactions').insert({
      assistant_id: assistant.id,
      request: JSON.stringify({ from, to, body: messageBody }),
      response: JSON.stringify({ message: aiResponse }),
      interaction_time: new Date().toISOString(),
      source: 'sms',
      metadata: {
        tokens: responseData.tokens,
        cost: responseData.cost,
        duration: responseData.timing?.responseDuration,
      },
    });

    return generateSMSResponse(aiResponse);
  } catch (error) {
    console.error('Error processing SMS:', error);

    // Record error interaction
    await supabase.from('interactions').insert({
      assistant_id: assistant.id,
      request: JSON.stringify({ from, to, body: messageBody }),
      response: JSON.stringify({ error: 'Processing failed' }),
      interaction_time: new Date().toISOString(),
      source: 'sms',
      metadata: { error: true },
    });

    return generateSMSResponse(
      "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    );
  }
}

async function handleVoiceCall(
  assistantId: string | null,
  from: string,
  to: string,
  callSid: string,
  speechResult: string | null,
  req: Request
) {
  console.log(`Handling voice call from ${from} to ${to}, CallSid: ${callSid}`);

  if (!assistantId) {
    console.log('No assistant ID provided for voice call');

    return generateVoiceResponse("I'm sorry, this call is not properly configured.");
  }

  const supabase = await createClient();

  // Get assistant details
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('id', assistantId)
    .single();

  if (!assistant) {
    console.error('Assistant not found:', error);

    return generateVoiceResponse(
      "I'm sorry, I couldn't find the assistant you're trying to reach."
    );
  }

  // If no speech result, this is the initial call - start gathering speech
  if (!speechResult) {
    console.log('Initial voice call - starting speech gathering');

    return generateVoiceGatherResponse(assistant.name, assistantId);
  }

  // Process the speech result
  console.log(`Processing speech: "${speechResult}"`);

  try {
    // Call the chat API
    const baseUrl = new URL(req.url);
    const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/Concierge/chat`;

    const chatPayload = {
      assistantId: assistant.id,
      message: speechResult,
      systemOverride:
        'You are responding to a voice call. Keep your response conversational and under 200 words.',
      userPhone: from,
    };

    const chatResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
      cache: 'no-store',
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat API error: ${chatResponse.status}`);
    }

    const responseData = (await chatResponse.json()) as ChatAPIResponse;
    const aiResponse = responseData.response ?? "I'm sorry, I couldn't generate a response.";

    // Record the interaction
    await supabase.from('interactions').insert({
      assistant_id: assistant.id,
      request: JSON.stringify({ from, to, callSid, speech: speechResult }),
      response: JSON.stringify({ message: aiResponse }),
      interaction_time: new Date().toISOString(),
      source: 'voice',
      metadata: {
        tokens: responseData.tokens,
        cost: responseData.cost,
        duration: responseData.timing?.responseDuration,
        callSid,
      },
    });

    return generateVoiceResponseWithGather(aiResponse, assistantId);
  } catch (error) {
    console.error('Error processing voice call:', error);

    // Record error interaction
    await supabase.from('interactions').insert({
      assistant_id: assistant.id,
      request: JSON.stringify({ from, to, callSid, speech: speechResult }),
      response: JSON.stringify({ error: 'Processing failed' }),
      interaction_time: new Date().toISOString(),
      source: 'voice',
      metadata: { error: true, callSid },
    });

    return generateVoiceResponse(
      "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    );
  }
}

function generateSMSResponse(message: string) {
  if (!message || message.trim() === '') {
    message = "I'm sorry, I couldn't generate a response.";
  }

  // Ensure message fits SMS length limits
  let sanitizedMessage = sanitizeForSms(message);

  if (sanitizedMessage.length > 1600) {
    sanitizedMessage = `${sanitizedMessage.slice(0, 1597)}...`;
  }

  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizedMessage}</Message>
</Response>`;

  return new Response(twimlString, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function generateVoiceResponse(message: string) {
  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
  <Hangup/>
</Response>`;

  return new Response(twimlString, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function generateVoiceGatherResponse(assistantName: string, assistantId: string) {
  const greeting = `Hello! You've reached ${assistantName}. Please tell me how I can help you today.`;

  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Gather 
    input="speech" 
    timeout="10" 
    speechTimeout="auto" 
    language="en-US"
    action="/api/twilio/gateway?assistantId=${assistantId}"
    method="POST">
    <Say voice="alice">I'm listening...</Say>
  </Gather>
  <Say voice="alice">I didn't hear anything. Please call back when you're ready to speak.</Say>
  <Hangup/>
</Response>`;

  return new Response(twimlString, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function generateVoiceResponseWithGather(message: string, assistantId: string) {
  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
  <Gather 
    input="speech" 
    timeout="10" 
    speechTimeout="auto" 
    language="en-US"
    action="/api/twilio/gateway?assistantId=${assistantId}"
    method="POST">
    <Say voice="alice">Is there anything else I can help you with?</Say>
  </Gather>
  <Say voice="alice">Thank you for calling. Have a great day!</Say>
  <Hangup/>
</Response>`;

  return new Response(twimlString, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function generateErrorResponse() {
  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm sorry, we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

  return new Response(twimlString, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
