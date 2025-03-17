import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server-admin';
import twilio from 'twilio';

// Constants and types
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'webhook-token-123456';
type TwiMLResponse = { message: string; isVoice?: boolean; logId?: string };

export async function POST(req: Request) {
  const startTime = new Date();
  const logId = Math.random().toString(36).substring(7);
  const logger = createLogger(logId);
  
  try {
    logger.info('Webhook received');
    
    // Parse and validate request
    const url = new URL(req.url);
    const formData = await req.formData();
    const requestData = Object.fromEntries(formData.entries());
    
    logger.debug('Request data:', { url: url.toString(), formData: requestData });

    // Validate Twilio signature
    if (!await validateTwilioRequest(req, url, requestData)) {
      logger.error('Invalid Twilio signature');
      return sendTwiMLResponse({ message: 'Unauthorized', logId });
    }

    // Extract assistant ID and validate request
    const assistantId = url.searchParams.get('assistantId');
    if (!assistantId) {
      logger.error('Missing assistantId');
      return sendTwiMLResponse({ message: 'Missing assistant ID', logId });
    }

    // Extract message data
    const { from, to, body, isVoice } = extractMessageData(formData);
    if (!isValidMessageData(from, to, body, isVoice)) {
      logger.error('Invalid message data');
      return sendTwiMLResponse({ message: 'Invalid message data', logId });
    }

    // Get assistant details
    const assistant = await getAssistantDetails(assistantId);
    if (!assistant) {
      logger.error('Assistant not found');
      return sendTwiMLResponse({ message: 'Assistant not found', logId });
    }

    // Handle voice calls differently
    if (isVoice) {
      return handleVoiceCall(assistant, from, logId);
    }

    // Process message and get AI response
    const aiResponse = await processMessage({
      assistant,
      message: body,
      from,
      to,
      logId,
      logger
    });

    logger.info('Request completed successfully');
    return sendTwiMLResponse({ 
      message: aiResponse,
      logId 
    });

  } catch (error) {
    logger.error('Webhook error:', error);
    return sendTwiMLResponse({ 
      message: 'An error occurred processing your message',
      logId
    });
  }
}

// Helper functions
function createLogger(logId: string) {
  return {
    info: (msg: string, data?: any) => console.log(`[${new Date().toISOString()}][${logId}] ${msg}`, data || ''),
    error: (msg: string, data?: any) => console.error(`[${new Date().toISOString()}][${logId}] ${msg}`, data || ''),
    debug: (msg: string, data?: any) => console.debug(`[${new Date().toISOString()}][${logId}] ${msg}`, data || '')
  };
}

async function validateTwilioRequest(req: Request, url: URL, formData: any): Promise<boolean> {
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  if (!twilioAuthToken) return true; // Skip validation if no auth token (development)

  const twilioSignature = req.headers.get('x-twilio-signature') || '';
  return twilio.validateRequest(
    twilioAuthToken,
    twilioSignature,
    url.toString(),
    formData
  );
}

function extractMessageData(formData: FormData) {
  return {
    from: formData.get('From') as string,
    to: formData.get('To') as string,
    body: formData.get('Body') as string,
    isVoice: !!formData.get('CallSid')
  };
}

function isValidMessageData(from?: string, to?: string, body?: string, isVoice?: boolean): boolean {
  return !!(from && to && (body || isVoice));
}

async function getAssistantDetails(assistantId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assistants')
    .select('id, name, user_id, assigned_phone_number')
    .eq('id', assistantId)
    .single();
    
  if (error || !data) return null;
  return data;
}

function sendTwiMLResponse({ message, isVoice, logId }: TwiMLResponse): Response {
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const twiml = isVoice
    ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapedMessage}</Say>
</Response>`
    : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedMessage}</Message>
</Response>`;

  return new Response(twiml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-ID': logId || 'unknown'
    }
  });
}

async function processMessage({ 
  assistant, 
  message, 
  from, 
  to, 
  logId,
  logger 
}: {
  assistant: any;
  message: string;
  from: string;
  to: string;
  logId: string;
  logger: any;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/assistant/chat/public`;

  logger.debug('Calling chat API:', { apiUrl, message });
  
  const chatResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Token': WEBHOOK_TOKEN
    },
    body: JSON.stringify({
      assistantId: assistant.id,
      message,
      systemOverride: `You are responding to an SMS message. Keep your response concise.`,
      userPhone: from,
      userId: assistant.user_id
    })
  });

  if (!chatResponse.ok) {
    logger.error('Chat API error:', { status: chatResponse.status });
    throw new Error('Failed to get AI response');
  }

  const responseData = await chatResponse.json();
  logger.debug('Chat API response:', responseData);

  // Record interaction in database
  await recordInteraction({
    assistant,
    message,
    response: responseData,
    from,
    to
  });

  return responseData.response || "I'm sorry, I couldn't generate a response.";
}

async function recordInteraction({ 
  assistant, 
  message, 
  response, 
  from, 
  to 
}: {
  assistant: any;
  message: string;
  response: any;
  from: string;
  to: string;
}) {
  const supabase = createServiceClient();
  
  await supabase.from('interactions').insert({
    user_id: assistant.user_id,
    assistant_id: assistant.id,
    request: message,
    response: response.response || '',
    chat: JSON.stringify({ from, to, body: message }),
    interaction_time: new Date().toISOString(),
    token_usage: response.tokens || null,
    input_tokens: response.usage?.promptTokens || null,
    output_tokens: response.usage?.completionTokens || null,
    cost_estimate: response.cost || null,
    duration: response.timing?.responseDuration || null
  });
}

function handleVoiceCall(assistant: any, caller: string, logId: string) {
  return sendTwiMLResponse({
    message: `Hello, you've reached the ${assistant.name} assistant. This assistant communicates via text messages. Please send an SMS to this number instead of calling.`,
    isVoice: true,
    logId
  });
}
