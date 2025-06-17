import type { ChatAPIResponse } from '@/types/api.types';
import { sanitizeForSms } from '@/utils/string-utils';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio webhook received`);

  try {
    // Parse and validate request
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    const token = url.searchParams.get('token'); // Optional verification token

    console.log(`Request URL: ${req.url}`);
    console.log(`Query parameters:`, Object.fromEntries(url.searchParams));

    const formData = await req.formData();
    console.log(`Form data keys: ${[...formData.keys()].join(', ')}`);

    // Extract data from Twilio webhook
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    // Log information about received SMS
    console.log(`Received SMS from ${from} to ${to}`);

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
      // Corrected schema
      .from('assistants')
      .select(
        `
        id,
        name,
        user_id,
        assigned_phone_number
      `
      )
      .eq('id', assistantId)
      .single();

    if (!assistant) {
      console.error('Error fetching No-Show by ID:', error);
      return generateSmsResponse('No-Show not found');
    }

    console.log(`Found No-Show: ${assistant.name} (ID: ${assistant.id})`);

    console.log(`Processing message for No-Show ${assistant.name}`);

    // Handle SMS message
    // logTwilio('Webhook', `Processing SMS message for No-Show ${assistantId}`); // Replaced

    try {
      // Get the base URL from the incoming request
      // This ensures we use the same host that received the webhook
      const baseUrl = new URL(req.url);
      const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/Concierge/chat`;

      console.log(`Calling No-Show chat API at: ${apiUrl}`);
      // logTwilio('Webhook', `Calling chat API with message: ${body.substring(0, 30)}${body.length > 30 ? '...' : ''}`); // Replaced

      const chatPayload = {
        assistantId: assistant.id,
        message: body,
        systemOverride: `You are responding to an SMS message. Keep your response concise.`,
        userPhone: from,
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
        cache: 'no-store', // Ensure we don't get cached responses
      });
      const chatEndTime = Date.now();

      console.log(`Chat API response time: ${chatEndTime - chatStartTime}ms`);
      console.log(`Chat API response status: ${chatResponse.status}`);

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text().catch(() => 'No error details');
        console.error(`Chat API error response: ${errorText}`);
        // logTwilioError('Webhook', `Chat API error: ${chatResponse.status}`, { errorText }); // Replaced
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const responseData = (await chatResponse.json()) as ChatAPIResponse;
      console.log(`Chat API response data: ${JSON.stringify(responseData)}`);
      const aiResponse = responseData.response ?? "I'm sorry, I couldn't generate a response.";
      console.log(
        `AI response: "${aiResponse.slice(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`
      );
      // logTwilio('Webhook', `AI generated SMS response: ${aiResponse.substring(0, 50)}${aiResponse.length > 50 ? '...' : ''}`); // Replaced

      console.log(`Tracked outgoing message for No-Show ${assistant.name}`);

      // Record the interaction
      console.log('Saving interaction to database');
      const { error: insertError } = await supabase
        // Corrected schema
        .from('interactions')
        .insert({
          user_id: assistant.user_id,
          assistant_id: assistant.id,
          request: body,
          response: aiResponse,
          chat: JSON.stringify({ from, to, body }),
          interaction_time: new Date().toISOString(),
          token_usage: responseData.tokens ?? null,
          input_tokens: responseData.usage?.promptTokens ?? null,
          output_tokens: responseData.usage?.completionTokens ?? null,
          cost_estimate: responseData.cost ?? null,
          duration: responseData.timing?.responseDuration ?? null,
        });

      if (insertError) {
        console.error('Error saving interaction:', insertError);
        // logTwilioError('Webhook', 'Failed to save interaction to database', insertError); // Replaced
      } else {
        console.log('Interaction saved successfully');
      }

      // Generate TwiML response with proper content
      console.log('Generating TwiML response for SMS');
      const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizeForSms(aiResponse)}</Message>
</Response>`;
      // logTwimlResponse(twimlString); // Replaced: logTwilioInteraction now handles logging the response if successful.

      return new Response(twimlString, {
        headers: { 'Content-Type': 'text/xml' },
      });
    } catch (aiError: unknown) {
      console.error('Error calling assistant chat API:', aiError);
      // logTwilioError('Webhook', 'Error in assistant chat flow', aiError); // Replaced

      // Fallback response
      const fallbackResponse =
        "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
      console.log(`Using fallback response: "${fallbackResponse}"`);

      // Record error interaction
      console.log('Recording error interaction');
      try {
        await supabase
          // Corrected schema
          .from('interactions')
          .insert({
            user_id: assistant.user_id,
            assistant_id: assistant.id,
            request: body,
            response: fallbackResponse,
            chat: JSON.stringify({ from, to, body }),
            interaction_time: new Date().toISOString(),
            is_error: true,
          });
      } catch (dbError) {
        console.error('Failed to save error interaction:', dbError);
      }

      return generateSmsResponse(fallbackResponse);
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    // logTwilioError('Webhook', 'Unhandled error in webhook processor', error); // Replaced
    // No assistantId available here, so we can't log with logTwilioInteraction fully.
    // Consider a more generic error logger if this case is critical.
    return generateSmsResponse(
      'Sorry, we encountered an error processing your message. Please try again later.'
    );
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
    sanitizedMessage = sanitizedMessage.slice(0, 1597) + '...';
  }

  // Log the exact message we're sending in TwiML
  // logTwilio('Webhook', `Sending SMS with content: ${sanitizedMessage}`); // Replaced: logTwilioInteraction handles this.

  // Create a simple TwiML response for maximum compatibility with all Twilio clients
  const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${sanitizedMessage}</Message>
</Response>`;

  // logTwimlResponse(twimlString); // Replaced: logTwilioInteraction handles this.

  return new Response(twimlString, {
    headers: {
      'Content-Type': 'application/xml', // Use application/xml instead of text/xml
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
