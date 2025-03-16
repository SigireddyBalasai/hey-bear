import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createServiceClient } from '@/utils/supabase/server-admin';
import { Tables } from '@/lib/db.types';

// Define table types
type Interactions = Tables<'interactions'>
type Assistant = Tables<'assistants'>

// A simple token for webhook authentication
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'webhook-token-123456';

export async function POST(req: NextRequest) {
  // Record the request timestamp
  const requestTimestamp = new Date();
  
  try {
    // Simple token auth - check header first, but allow internal calls
    const providedToken = req.headers.get('X-Webhook-Token');
    // For internal server-to-server API calls, we check the token
    // For calls from external webhook providers, we trust our own server's call
    const internalRequest = 
      providedToken === WEBHOOK_TOKEN || 
      req.headers.get('user-agent')?.includes('node-fetch') || 
      req.headers.get('user-agent')?.includes('undici');
    
    if (!internalRequest) {
      console.error('Invalid webhook token or unauthorized source');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, message, userId, systemOverride, userPhone } = body;
    
    // Validate required fields
    if (!assistantId || !message || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Use non-auth client
    const supabase = createServiceClient();

    // Fetch the assistant from the database to get its Pinecone name
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('pinecone_name, name')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }
    
    const { pinecone_name, name: assistantName } = assistantData;
    
    if (!pinecone_name) {
      return NextResponse.json({ error: 'Invalid assistant configuration: missing Pinecone name' }, { status: 500 });
    }

    // Handle Pinecone assistant
    try {
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }

      console.log(`Using Pinecone assistant name: ${pinecone_name}`);
      const assistant = pinecone.Assistant(pinecone_name);
      if (!assistant) {
        return NextResponse.json({ error: 'Failed to create assistant' }, { status: 500 });
      }

      // Create messages array with proper role validation
      const messages = [];
      
      // Add system message first if provided
      if (systemOverride) {
        messages.push({
          role: 'assistant', // Use 'assistant' for system messages
          content: systemOverride
        });
      }
      
      // Add user message
      messages.push({
        role: 'user',
        content: message
      });
      
      // Use only valid options for Pinecone Assistant API
      const response = await assistant.chat({ messages });
      
      // Record the response timestamp
      const responseTimestamp = new Date();
      const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds
      
      if (!response || !response.message) {
        return NextResponse.json({ error: 'Assistant returned no response' }, { status: 500 });
      }

      // Extract token usage and cost information from the response if available
      const tokenCount = response.usage?.totalTokens || 0;
      // Simple cost estimation (adjust the rate based on your actual pricing)
      const costRate = 0.002 / 1000; // Example: $0.002 per 1000 tokens
      const costEstimate = tokenCount * costRate;

      // Record additional metadata for context if provided
      const chatMetadata = userPhone ? 
        JSON.stringify({ type: 'sms', userPhone, message }) : 
        message;

      // Save interaction to Supabase with proper typing
      const interactionData: Omit<Interactions, 'id'> = {
        request: message,
        assistant_id: assistantId,
        chat: chatMetadata,
        response: response.message?.content || "",
        duration: responseDuration,
        interaction_time: requestTimestamp.toISOString(),
        user_id: userId,
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
      }
      
      // Update assistant usage statistics
      const { error: usageError } = await supabase
        .from('assistants')
        .update({
          params: {
            last_used_at: requestTimestamp.toISOString()
          }
        })
        .eq('id', assistantId);

      if (usageError) {
        console.error('Error updating assistant usage:', usageError);
      }

      return NextResponse.json({ 
        response: response.message?.content || '',
        tokens: tokenCount,
        cost: costEstimate,
        usage: response.usage,
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
