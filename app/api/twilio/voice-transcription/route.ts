import { createClient } from '@/utils/supabase/server';
import { logTwilio, logTwilioError, logTwimlResponse } from '@/utils/twilio-logger';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio voice transcription webhook received`);
  logTwilio('VoiceTranscription', 'Webhook received');
  
  try {
    // Extract parameters from the URL
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    
    // Read the form data once and reuse it
    const formData = await req.formData();
    const from = url.searchParams.get('from') || formData.get('From') as string;
    const to = url.searchParams.get('to') || formData.get('To') as string;
    const callSid = formData.get('CallSid') as string;
    
    // Log request details
    console.log(`Request URL: ${req.url}`);
    console.log(`Query parameters: ${JSON.stringify(Object.fromEntries(url.searchParams))}`);
    logTwilio('VoiceTranscription', 'Query parameters', Object.fromEntries(url.searchParams));
    
    console.log(`Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    logTwilio('VoiceTranscription', `Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    
    // Check if this is a direct call or a transcription result
    const speechResult = formData.get('SpeechResult') as string;
    
    // If it's a direct call (no speech result), start the greeting flow
    if (!speechResult && callSid) {
      logTwilio('VoiceTranscription', 'Initial voice call detected - starting greeting flow');
      
      // Validate required parameters
      if (!assistantId) {
        logTwilioError('VoiceTranscription', 'Missing No-show parameter for initial voice call');
        return generateBasicVoiceResponse("I'm sorry, but this call is not properly configured. Please try again later.");
      }
      
      // Initialize Supabase with error handling
      let supabase;
      try {
        supabase = await createClient();
      } catch (dbError) {
        logTwilioError('VoiceTranscription', 'Failed to initialize Supabase client', dbError);
        return generateBasicVoiceResponse("I'm sorry, we're experiencing technical difficulties. Please try again later.");
      }
      
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
        logTwilioError('VoiceTranscription', 'Failed to fetch assistant details', error);
        return generateBasicVoiceResponse("I'm sorry, I couldn't find the assistant you're trying to reach.");
      }
      
      // Generate a greeting and directly start listening for speech
      return generateWelcomeWithGather(assistant.name);
    }
    
    // Handle the speech recognition result
    if (speechResult) {
      console.log(`Transcribed speech: "${speechResult}"`);
      logTwilio('VoiceTranscription', `Transcribed speech: "${speechResult}"`);
      
      if (!assistantId || !from || !to) {
        console.error('Missing required parameters', { assistantId, from, to });
        return generateVoiceResponse("I'm sorry, there was an error processing your request.");
      }
      
      // Initialize Supabase with error handling
      let supabase;
      try {
        supabase = await createClient();
        console.log('Supabase client initialized for voice transcription');
      } catch (dbError) {
        console.error('Failed to initialize Supabase client:', dbError);
        return generateVoiceResponse("I'm sorry, we're experiencing database issues. Please try again later.");
      }
      
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
        return generateVoiceResponse("I'm sorry, I couldn't find the assistant you're looking for.");
      }
      
      console.log(`Found assistant: ${assistant.name} (ID: ${assistant.id})`);
      
      try {
        // Get the base URL from the incoming request
        const baseUrl = new URL(req.url);
        const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/Concierge/chat`;
        
        // Create a simplified message for voice interactions
        const systemMessage = "You are responding to a voice call. Keep your response concise, conversational, and under 150 words. Avoid using special characters or symbols that might be difficult to pronounce.";
        
        console.log(`Calling assistant chat API at: ${apiUrl}`);
        console.log(`Request payload for voice: ${JSON.stringify({
          assistantId: assistant.id,
          message: speechResult,
          systemOverride: systemMessage,
          userPhone: from
        })}`);
        
        // Send the transcribed speech to the chat API
        const chatStartTime = Date.now();
        const chatResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId: assistant.id,
            message: speechResult,
            systemOverride: systemMessage,
            userPhone: from
          }),
        });
        const chatEndTime = Date.now();
        
        console.log(`Chat API response time: ${chatEndTime - chatStartTime}ms`);
        console.log(`Chat API response status: ${chatResponse.status}`);
        
        if (!chatResponse.ok) {
          const errorText = await chatResponse.text().catch(() => 'No error details');
          console.error(`Chat API error response: ${errorText}`);
          return generateVoiceResponse("I'm sorry, I couldn't process your request right now. Please try again later.");
        }
        
        // Try to parse the response as JSON with error handling
        let responseData;
        try {
          responseData = await chatResponse.json();
          console.log(`Chat API response data: ${JSON.stringify(responseData)}`);
        } catch (parseError) {
          console.error('Failed to parse chat API response as JSON:', parseError);
          return generateVoiceResponse("I'm sorry, I received an invalid response format. Please try again later.");
        }
        
        // Get the AI response with fallback
        const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
        console.log(`AI response for voice: "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`);
        
        // Save interaction even if there's an error later
        try {
          // Record the interaction in the database
          console.log('Saving voice interaction to database');
          const { error: insertError } = await supabase
            .from('interactions')
            .insert({
              user_id: assistant.user_id,
              assistant_id: assistant.id,
              request: speechResult,
              response: aiResponse,
              chat: JSON.stringify({ from, to, type: 'voice', speech: speechResult }),
              interaction_time: new Date().toISOString(),
              token_usage: responseData.tokens || null,
              input_tokens: responseData.usage?.promptTokens || null,
              output_tokens: responseData.usage?.completionTokens || null,
              cost_estimate: responseData.cost || null,
              duration: responseData.timing?.responseDuration || null
            });
          
          if (insertError) {
            console.error('Error saving voice interaction:', insertError);
          } else {
            console.log('Voice interaction saved successfully');
          }
        } catch (dbError) {
          console.error('Failed to save interaction:', dbError);
          // Continue anyway - don't fail the call if DB save fails
        }
        
        // Make sure the response is not too long for TwiML
        const truncatedResponse = truncateForVoice(aiResponse);
        
        // Speak the response and then offer another chance to speak without an action URL
        return generateVoiceResponseWithSimpleGather(truncatedResponse);
      } catch (error) {
        console.error('Error processing voice transcription:', error);
        return generateVoiceResponse("I'm sorry, I encountered an error. Please try again later.");
      }
    } else {
      // No speech result received
      console.log('No speech transcription received');
      // Check for specific speech recognition errors
      const speechError = formData.get('SpeechError') as string;
      if (speechError) {
        console.error(`Speech error reported by Twilio: ${speechError}`);
        logTwilioError('VoiceTranscription', `Speech error reported by Twilio: ${speechError}`);
      }
      
      // Generate TwiML for a simple reprompt without action URL
      return generateRepromptResponse();
    }
  } catch (error) {
    console.error('Error in voice transcription webhook:', error);
    logTwilioError('VoiceTranscription', 'Error in webhook handler', error);
    return generateVoiceResponse("I'm sorry, something went wrong. Please try again.");
  }
}

// Generate a welcome message with speech gathering capability
function generateWelcomeWithGather(assistantName: string) {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, this is ${assistantName}. How can I help you today?</Say>
  <Gather input="speech" speechTimeout="auto" language="en-US" enhanced="true" speechModel="phone_call">
  </Gather>
  <Say voice="alice">I didn't hear anything. Please call again if you'd like to speak with me. Goodbye.</Say>
</Response>`;
  
  logTwimlResponse(twimlResponse);
  
  return new Response(twimlResponse, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Generate a response to speech with another gather opportunity
function generateVoiceResponseWithSimpleGather(message: string) {
  try {
    console.log(`Generating voice response with follow-up gather option`);
    logTwilio('VoiceTranscription', `Generating voice response with follow-up gather option`);
    
    // Sanitize the message for TwiML
    const sanitizedMessage = sanitizeMessage(message);
    
    // Create a response that allows for follow-up questions without an action URL
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizedMessage}</Say>
  <Pause length="1"/>
  <Say voice="alice">Is there anything else you'd like to know?</Say>
  <Gather input="speech" speechTimeout="auto" language="en-US" enhanced="true" speechModel="phone_call">
  </Gather>
  <Say voice="alice">Thank you for calling. Goodbye.</Say>
</Response>`;
    
    logTwimlResponse(twimlResponse);
    return new Response(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Error generating voice response with gather:', error);
    logTwilioError('VoiceTranscription', 'Error generating voice response with gather', error);
    
    // Fall back to simple response without gather
    return generateVoiceResponse(message);
  }
}

// Generate a reprompt when no speech was detected
function generateRepromptResponse() {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I couldn't quite catch that. Could you please try speaking again?</Say>
  <Gather input="speech" speechTimeout="auto" language="en-US" enhanced="true" speechModel="phone_call">
  </Gather>
  <Say voice="alice">I still didn't hear anything. Please call back when you're ready to speak with me. Goodbye.</Say>
</Response>`;

  logTwimlResponse(twimlResponse);
  return new Response(twimlResponse, {
    headers: { 'Content-Type': 'text/xml' }
  });
}

// Truncate response to a safe length for voice
function truncateForVoice(message: string): string {
  // TwiML has limits on response size, so truncate if necessary
  // 1000 chars should be safe for most responses
  if (message.length > 1000) {
    logTwilio('VoiceTranscription', `Truncating long response from ${message.length} to 1000 chars`);
    return message.substring(0, 997) + "...";
  }
  return message;
}

// Generate a TwiML voice response with better error handling
function generateVoiceResponse(message: string) {
  try {
    console.log(`Generating voice response with message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
    logTwilio('VoiceTranscription', `Generating voice response: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
    
    // Sanitize the message for TwiML
    const sanitizedMessage = sanitizeMessage(message);
    
    // Create a simple response without too many extras
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizedMessage}</Say>
  <Pause length="1"/>
  <Say voice="alice">Thank you for calling. Goodbye.</Say>
</Response>`;
    
    logTwimlResponse(twimlResponse);
    console.log(`Voice TwiML response length: ${twimlResponse.length} chars`);
    
    return new Response(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Error generating voice response:', error);
    logTwilioError('VoiceTranscription', 'Error generating voice response', error);
    
    // Super simple fallback if everything else fails
    const fallbackResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm sorry, an error occurred while processing your request. Please try again later.</Say>
</Response>`;
    
    return new Response(fallbackResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

// Sanitize message for XML with better error handling
function sanitizeMessage(message: string): string {
  if (!message) return "Sorry, no message was provided.";
  
  try {
    return message
      .replace(/&/g, 'and')  // Replace & with 'and' instead of &amp; to avoid TTS issues
      .replace(/</g, '')     // Remove < completely
      .replace(/>/g, '')     // Remove > completely
      .replace(/"/g, '')     // Remove quotes completely
      .replace(/'/g, '')     // Remove apostrophes completely
      // Replace any other potentially problematic characters
      .replace(/[^\w\s.,?!;:()\-]/g, ''); // Only allow safe characters
  } catch (error) {
    console.error('Error sanitizing message:', error);
    return "I'm sorry, there was an error processing the response.";
  }
}

// A simple voice response for errors
function generateBasicVoiceResponse(message: string) {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizeMessage(message)}</Say>
</Response>`;
  
  return new Response(twimlResponse, {
    headers: { 'Content-Type': 'text/xml' }
  });
}
