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
  
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, message, systemOverride } = body;
    
    // Validate required fields
    if (!assistantId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user ID from users table using auth user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User not found in users table:', userError);
      return NextResponse.json({ error: 'User not found in system' }, { status: 404 });
    }

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

      // Handle system message by including it in the messages array if provided
      let messages;
      if (systemOverride) {
        // Add system message first, then user message
        messages = [
          { role: 'system', content: systemOverride },
          { role: 'user', content: message }
        ];
      } else {
        messages = [{ role: 'user', content: message }];
      }
      
      // Use only valid options for Pinecone Assistant API
      const response = await assistant.chat({ messages });
      
      // Record the response timestamp
      const responseTimestamp = new Date();
      const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds
      
      if (!response || !response.message) {
        return NextResponse.json({ error: 'Assistant returned no response' }, { status: 500 });
      }

      // Extract token usage and cost information from the response if available
      const tokenCount = response.usage?.totalTokens || 0
      // Simple cost estimation (adjust the rate based on your actual pricing)
      const costRate = 0.002 / 1000; // Example: $0.002 per 1000 tokens
      const costEstimate = tokenCount * costRate;

      // Save interaction to Supabase with proper typing, using the actual user ID from users table
      const interactionData: Omit<Interactions, 'id'> = {
        request:  message,
        assistant_id: assistantId,
        chat: message,
        response:  response.message?.content || "",
        duration: responseDuration,
        interaction_time: requestTimestamp.toISOString(),
        user_id: userData.id, // Use the ID from users table, not the auth user ID
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
          // Only use fields that exist in the assistants table schema
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
