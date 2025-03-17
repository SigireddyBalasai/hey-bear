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
      return generateVoiceResponse("I'm sorry, I couldn't understand what you said. Please try again.");
    }
    
    console.log(`Transcribed speech: "${speechResult}"`);
    console.log(`Transcription confidence: ${confidence || 'unknown'}`);
    
    if (!assistantId || !from || !to) {
      console.error('Missing required parameters');
      return generateVoiceResponse("I'm sorry, there was an error processing your request.");
    }
    
    const supabase = await createClient();
    
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
      
      console.log(`Calling assistant chat API at: ${apiUrl}`);
      console.log(`Request payload for voice: ${JSON.stringify({
        assistantId: assistant.id,
        message: speechResult,
        systemOverride: `You are responding to a voice call. Keep your response concise and conversational.`,
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
          systemOverride: `You are responding to a voice call. Keep your response concise and conversational.`,
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
      
      const responseData = await chatResponse.json();
      console.log(`Chat API response data: ${JSON.stringify(responseData)}`);
      const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
      console.log(`AI response for voice: "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`);
      
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
      
      // Generate TwiML to speak the response back to the caller
      return generateVoiceResponse(aiResponse);
      
    } catch (error) {
      console.error('Error processing voice transcription:', error);
      return generateVoiceResponse("I'm sorry, I encountered an error. Please try again later.");
    }
  } catch (error) {
    console.error('Error in voice transcription webhook:', error);
    return generateVoiceResponse("I'm sorry, something went wrong. Please try again.");
  }
}

// Generate a TwiML voice response
function generateVoiceResponse(message: string) {
  console.log(`Generating voice response with message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
  
  // Optionally add a callback to gather more input after the response
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${sanitizeMessage(message)}</Say>
  <Pause length="1"/>
  <Say voice="alice">If you'd like to ask another question, please call again. Goodbye.</Say>
</Response>`;
  
  console.log(`Voice TwiML response: ${twimlResponse.replace(/\n/g, ' ')}`);
  
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
