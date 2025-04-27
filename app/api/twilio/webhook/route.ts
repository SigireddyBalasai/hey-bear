import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logTwilio, logTwilioError, formatTwilioWebhook, logTwimlResponse } from '@/utils/twilio-logger';
import { sanitizeForSms, logIncomingSms } from '@/utils/sms-monitoring';
import { trackUsage, isLimitReached, UsageType } from '@/utils/usage-limits';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio webhook received`);
  logTwilio('Webhook', 'SMS webhook received');
  
  try {
    // Parse and validate request
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    const token = url.searchParams.get('token'); // Optional verification token
    
    console.log(`Request URL: ${req.url}`);
    console.log(`Query parameters: ${JSON.stringify(Object.fromEntries(url.searchParams))}`);
    
    const formData = await req.formData();
    console.log(`Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    
    // Extract data from Twilio webhook
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    
    // Log information about received SMS
    console.log(`Received SMS from ${from} to ${to}`);
    if (body) {
      console.log(`Message content: "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`);
      logIncomingSms(from, to, body);
    }
    
    // Optional token verification - can be enabled in a production environment
    if (process.env.VERIFY_WEBHOOK_TOKEN === 'true' && token !== process.env.WEBHOOK_TOKEN) {
      console.error('Invalid webhook token');
      return generateSmsResponse('Unauthorized webhook access');
    }
    
    if (!assistantId) {
      console.log(`No No-show provided, cannot process request`);
      return generateSmsResponse('No-show ID is required');
    }
    
    console.log(`Using assistantId from URL param: ${assistantId}`);
    
    if (!from || !to || !body) {
      console.error('Missing required information:', { from: !!from, to: !!to, body: !!body });
      return generateSmsResponse('Missing required information');
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
      console.error('Error fetching No-Show by ID:', error);
      return generateSmsResponse('No-Show not found');
    }

    console.log(`Found No-Show: ${assistant.name} (ID: ${assistant.id})`);
    
    // Check if message limit has been reached
    const isLimitExceeded = await isLimitReached(assistantId, UsageType.MESSAGE_RECEIVED);
    if (isLimitExceeded) {
      console.log(`Message limit reached for No-Show ${assistant.name}`);
      return generateSmsResponse(
        "I'm sorry, this No-Show has reached its monthly message limit. " +
        "Please upgrade your plan or wait until next month to continue the conversation."
      );
    }
    
    // Track the incoming message
    await trackUsage(assistantId, UsageType.MESSAGE_RECEIVED);
    console.log(`Tracked incoming message for No-Show ${assistant.name}`);
    
    // Handle SMS message
    logTwilio('Webhook', `Processing SMS message for No-Show ${assistantId}`);
    
    try {
      // Get the base URL from the incoming request
      // This ensures we use the same host that received the webhook
      const baseUrl = new URL(req.url);
      const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/Concierge/chat`;
      
      console.log(`Calling No-Show chat API at: ${apiUrl}`);
      logTwilio('Webhook', `Calling chat API with message: ${body.substring(0, 30)}${body.length > 30 ? '...' : ''}`);
      
      const chatPayload = {
        assistantId: assistant.id,
        message: body,
        systemOverride: `You are responding to an SMS message. Keep your response concise.`,
        userPhone: from
      };
      
      console.log(`Request payload: ${JSON.stringify(chatPayload)}`);
      
      // Send the request to the chat endpoint using the current host
      const chatStartTime = Date.now();
      const chatResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatPayload),
        cache: 'no-store' // Ensure we don't get cached responses
      });
      const chatEndTime = Date.now();
      
      console.log(`Chat API response time: ${chatEndTime - chatStartTime}ms`);
      console.log(`Chat API response status: ${chatResponse.status}`);

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text().catch(() => 'No error details');
        console.error(`Chat API error response: ${errorText}`);
        logTwilioError('Webhook', `Chat API error: ${chatResponse.status}`, { errorText });
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const responseData = await chatResponse.json();
      console.log(`Chat API response data: ${JSON.stringify(responseData)}`);
      const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
      console.log(`AI response: "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`);
      logTwilio('Webhook', `AI generated SMS response: ${aiResponse.substring(0, 50)}${aiResponse.length > 50 ? '...' : ''}`);
      
      // Track the outgoing message
      await trackUsage(assistantId, UsageType.MESSAGE_SENT);
      console.log(`Tracked outgoing message for No-Show ${assistant.name}`);
      
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
        logTwilioError('Webhook', 'Failed to save interaction to database', insertError);
      } else {
        console.log('Interaction saved successfully');
      }
      
      // Generate TwiML response with proper content
      console.log('Generating TwiML response for SMS');
      const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizeForSms(aiResponse)}</Message>
</Response>`;
      logTwimlResponse(twimlString);
      
      return new Response(twimlString, {
        headers: { 'Content-Type': 'text/xml' }
      });
      
    } catch (aiError) {
      console.error('Error calling assistant chat API:', aiError);
      logTwilioError('Webhook', 'Error in assistant chat flow', aiError);
      
      // Fallback response
      const fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
      console.log(`Using fallback response: "${fallbackResponse}"`);
      
      // Record error interaction
      console.log('Recording error interaction');
      try {
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
      } catch (dbError) {
        console.error('Failed to save error interaction:', dbError);
      }
      
      return generateSmsResponse(fallbackResponse);
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    logTwilioError('Webhook', 'Unhandled error in webhook processor', error);
    return generateSmsResponse('Sorry, we encountered an error processing your message. Please try again later.');
  }
}

// Modified function to generate SMS response
function generateSmsResponse(message: string) {
  // Ensure message is not empty
  if (!message || message.trim() === '') {
    message = "I'm sorry, I couldn't generate a response.";
  }
  
  // Sanitize the message for SMS - but don't strip too aggressively
  let sanitizedMessage = message;
  if (sanitizedMessage.length > 1600) {
    sanitizedMessage = sanitizedMessage.substring(0, 1597) + '...';
  }
  
  // Log the exact message we're sending in TwiML
  logTwilio('Webhook', `Sending SMS with content: ${sanitizedMessage}`);
  
  // Create a simple TwiML response for maximum compatibility with all Twilio clients
  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizedMessage}</Message>
</Response>`;
  
  logTwimlResponse(twimlString);
  
  return new Response(twimlString, {
    headers: { 
      'Content-Type': 'application/xml',  // Use application/xml instead of text/xml
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

// Simplified sanitize message function for back-compatibility
function sanitizeMessage(message: string): string {
  return sanitizeForSms(message);
}
