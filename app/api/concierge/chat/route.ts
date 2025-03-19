import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/lib/db.types';

// Define table types for better type safety
type Interactions = Tables<'interactions'>
type Assistant = Tables<'assistants'>
export async function POST(req: NextRequest) {
  // Record the request timestamp
  const requestTimestamp = new Date();
  console.log(`[${requestTimestamp.toISOString()}] Concierge chat API called`);
  
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      console.error('Invalid JSON in request body');
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, message, systemOverride, userPhone } = body;
    console.log(`Request parameters: assistantId=${assistantId}, message length=${message?.length || 0}`);
    console.log(`Request message: "${message?.substring(0, 100)}${message?.length > 100 ? '...' : ''}"`);
    
    if (systemOverride) {
      console.log(`System override provided: "${systemOverride}"`);
    }
    
    if (userPhone) {
      console.log(`User phone: ${userPhone}`);
    }
    
    // Validate required fields
    if (!assistantId || !message) {
      console.error(`Missing required fields: assistantId=${!!assistantId}, message=${!!message}`);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Removed authentication check - the assistant is now accessible without login

    // Fetch the assistant from the database to get its Pinecone name
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('pinecone_name, name')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('Error fetching concierge:', assistantError);
      return NextResponse.json({ error: 'Concierge not found' }, { status: 404 });
    }
    const { pinecone_name, name: assistantName } = assistantData;
    console.log(`Found assistant: name=${assistantName}, pinecone_name=${pinecone_name}`);
    
    if (!pinecone_name) {
      console.error('Invalid assistant configuration: missing Pinecone name');
      return NextResponse.json({ error: 'Invalid assistant configuration: missing Pinecone name' }, { status: 500 });
    }

    // Handle Pinecone assistant
    try {
      console.log('Initializing Pinecone client');
      const pinecone = getPineconeClient();
      if (!pinecone) {
        console.error('Failed to initialize Pinecone client');
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }

      console.log(`Creating Pinecone assistant with name: ${pinecone_name}`);
      const assistant = pinecone.Assistant(pinecone_name);
      if (!assistant) {
        console.error('Failed to create Pinecone assistant');
        return NextResponse.json({ error: 'Failed to create assistant' }, { status: 500 });
      }

      // Prepare chat messages with optional system override
      const messages = [];
      
      if (systemOverride) {
        messages.push({ role: 'assistant', content: systemOverride });
      }
      
      messages.push({ role: 'user', content: message });
      
      console.log('Sending message to assistant for processing...');
      console.log(`Messages: ${JSON.stringify(messages)}`);

      // Try sending the message with detailed error logging
      let response;
      try {
        response = await assistant.chat({ messages });
        console.log('Received response from assistant');
      } catch (assistantError: unknown) {
        console.error('Error from Pinecone assistant chat:', assistantError);
        const errorMessage = assistantError instanceof Error ? assistantError.message : String(assistantError);
        throw new Error(`Failed to get response from assistant: ${errorMessage}`);
      }
      
      // Record the response timestamp
      const responseTimestamp = new Date();
      const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds
      console.log(`Response time: ${responseDuration}ms`);
      
      if (!response || !response.message) {
        console.error('Assistant returned no response');
        return NextResponse.json({ error: 'Assistant returned no response' }, { status: 500 });
      }

      // Log the response content
      console.log(`Assistant response: "${response.message?.content?.substring(0, 100)}${(response.message?.content?.length || 0) > 100 ? '...' : ''}"`);

      // Extract token usage and cost information from the response if available
      const tokenCount = response.usage?.totalTokens || 0
      // Simple cost estimation (adjust the rate based on your actual pricing)
      const costRate = 0.002 / 1000; // Example: $0.002 per 1000 tokens
      const costEstimate = tokenCount * costRate;
      console.log(`Token usage: ${tokenCount} tokens (prompt: ${response.usage?.promptTokens || 'N/A'}, completion: ${response.usage?.completionTokens || 'N/A'})`);
      console.log(`Estimated cost: $${costEstimate.toFixed(6)}`);

      // Save interaction to Supabase without requiring user_id
      const interactionData: Omit<Interactions, 'id'> = {
        request: message,
        assistant_id: assistantId,
        chat: message,
        response: response.message?.content || "",
        duration: responseDuration,
        interaction_time: requestTimestamp.toISOString(),
        user_id: null, // Now null since we're not authenticating
        cost_estimate: costEstimate > 0 ? costEstimate : null,
        is_error: false,
        token_usage: tokenCount > 0 ? tokenCount : null,
        input_tokens: response.usage?.promptTokens || null,
        output_tokens: response.usage?.completionTokens || null
      };
      
      const { error: interactionError } = await supabase
        .from('interactions')
        .insert(interactionData);

      if (interactionError) {
        console.error('Error saving interaction to Supabase:', interactionError);
      } else {
        console.log('Successfully saved interaction to Supabase');
      }
      
      // Update assistant usage statistics
      const { error: usageError } = await supabase
        .from('assistants')
        .update({
          // Only use fields that exist in the assistants table schema
          params: {
            last_used_at: requestTimestamp.toISOString()
          }
        })
        .eq('id', assistantId);

      if (usageError) {
        console.error('Error updating assistant usage:', usageError);
      } else {
        console.log('Successfully updated assistant usage statistics');
      }

      console.log(`[${responseTimestamp.toISOString()}] Assistant chat API completed successfully`);
      return NextResponse.json({ 
        response: response.message?.content || '',
        tokens: tokenCount,
        cost: costEstimate,
        timing: {
          requestTimestamp: requestTimestamp.toISOString(),
          responseTimestamp: responseTimestamp.toISOString(),
          responseDuration: responseDuration
        }
      });
    } catch (assistantError) {
      console.error('Error interacting with assistant:', assistantError);
      return NextResponse.json(
        { error: 'Failed to process request with the assistant' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
