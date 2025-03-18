import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Twilio voice transcription webhook received`);
  
  try {
    // Extract parameters from the URL
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    
    console.log(`Request URL: ${req.url}`);
    console.log(`Query parameters: ${JSON.stringify(Object.fromEntries(url.searchParams))}`);
    
    const formData = await req.formData();
    console.log(`Form data keys: ${Array.from(formData.keys()).join(', ')}`);
    
    // Extract the speech transcription from Twilio
    const speechResult = formData.get('SpeechResult') as string;
    const confidence = formData.get('Confidence') as string;
    
    if (!speechResult) {
      console.log('No speech transcription received');
      // Check for potential error conditions
      const speechError = formData.get('SpeechError') as string;
      if (speechError) {
        console.error(`Speech error reported by Twilio: ${speechError}`);
      }
      
      return generateVoiceResponse("I'm sorry, I couldn't understand what you said. Could you please try again?");
    }
    
    console.log(`Transcribed speech: "${speechResult}"`);
    console.log(`Transcription confidence: ${confidence || 'unknown'}`);
    
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
      const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/assistant/chat`;
      
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
      
      // Generate TwiML to speak the response back to the caller
      return generateVoiceResponse(truncatedResponse);
      
    } catch (error) {
      console.error('Error processing voice transcription:', error);
      return generateVoiceResponse("I'm sorry, I encountered an error. Please try again later.");
    }
  } catch (error) {
    console.error('Error in voice transcription webhook:', error);
    return generateVoiceResponse("I'm sorry, something went wrong. Please try again.");
  }
}

// Truncate response to a safe length for voice
function truncateForVoice(message: string): string {
  // TwiML has limits on response size, so truncate if necessary
  // 1000 chars should be safe for most responses
  if (message.length > 1000) {
    return message.substring(0, 997) + "...";
  }
  return message;
}

// Generate a TwiML voice response with better error handling
function generateVoiceResponse(message: string) {
  try {
    console.log(`Generating voice response with message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
    
    // Sanitize the message for TwiML
    const sanitizedMessage = sanitizeMessage(message);
    
    // Create a simple response without too many extras
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizedMessage}</Say>
</Response>`;
    
    console.log(`Voice TwiML response length: ${twimlResponse.length} chars`);
    
    return new Response(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Error generating voice response:', error);
    
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
