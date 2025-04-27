import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/lib/db.types';
import { checkAssistantSubscription } from '@/utils/subscriptions';
import { trackUsage, isLimitReached, UsageType } from '@/utils/usage-limits';

// Define table types for better type safety
type Interactions = Tables<'interactions'>
type Assistant = Tables<'assistants'>

// Helper function to generate a personalized and behaviorally-correct system prompt
function generateBehaviorPrompt(
  assistantName: string,
  params: any
): string {
  // Extract parameters if they exist
  const conciergeName = params?.conciergeName || assistantName;
  const businessName = params?.businessName || '';
  const personality = params?.conciergePersonality?.toLowerCase() || 'business casual';
  
  // Start with the introduction template based on personality
  let prompt = '';
  
  // First set the greeting format based on personality
  if (personality.includes('friendly')) {
    prompt = `Hey there! This is ${conciergeName} from ${businessName} 😊 What can I do for you?`;
  } else if (personality.includes('formal')) {
    prompt = `Hello, this is ${conciergeName} representing ${businessName}. How may I assist you?`;
  } else {
    // Default to business casual
    prompt = `Hi! ${conciergeName} here with ${businessName} — what can I help with today?`;
  }
  
  // Add the behavior instructions
  prompt += `\n\nAs ${conciergeName}, I represent ${businessName || 'this business'} directly. I'll always speak as a helpful, knowledgeable employee—not like a search engine or AI assistant. I'll never reference "search results" or say phrases like "this appears to be." I know the business well and speak with a ${personality} tone throughout our conversation.`;
  
  return prompt;
}

export async function POST(req: NextRequest) {
  // Record the request timestamp
  const requestTimestamp = new Date();
  console.log(`[${requestTimestamp.toISOString()}] No-Show chat API called`);
  
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
    
    // Check if the assistant has an active subscription
    const subscriptionCheck = await checkAssistantSubscription(assistantId);
    if (!subscriptionCheck.isActive) {
      console.error(`Subscription check failed: ${subscriptionCheck.error}`, subscriptionCheck);
      return NextResponse.json({ 
        error: 'Subscription required', 
        details: 'This assistant requires an active subscription to use chat functionality',
        subscription: {
          status: subscriptionCheck.status || 'inactive',
          plan: subscriptionCheck.plan
        }
      }, { status: 402 }); // 402 Payment Required
    }
    
    // Check if message limit has been reached
    const isLimitExceeded = await isLimitReached(assistantId, UsageType.MESSAGE_RECEIVED);
    if (isLimitExceeded) {
      console.log(`Message limit reached for No-Show ${assistantId}`);
      return NextResponse.json({
        error: 'Usage limit reached',
        details: 'This No-Show has reached its monthly message limit. Please upgrade your plan or wait until next month to continue the conversation.',
        limitReached: true
      }, { status: 429 }); // 429 Too Many Requests
    }
    
    // Track the incoming message (only if it's not coming from an SMS - those are tracked in the webhook)
    if (!userPhone) {
      await trackUsage(assistantId, UsageType.MESSAGE_RECEIVED);
      console.log(`Tracked direct web message for No-Show ${assistantId}`);
    }
    
    const supabase = await createClient();

    // Fetch the assistant from the database to get its Pinecone name
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('pinecone_name, name, params')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.error('Error fetching No-Show:', assistantError);
      return NextResponse.json({ error: 'No-Show not found' }, { status: 404 });
    }
    const { pinecone_name, name: assistantName, params } = assistantData;
    console.log(`Found No-Show: name=${assistantName}, pinecone_name=${pinecone_name}`);
    
    if (!pinecone_name) {
      console.error('Invalid No-Show configuration: missing Pinecone name');
      return NextResponse.json({ error: 'Invalid No-Show configuration: missing Pinecone name' }, { status: 500 });
    }

    // Handle Pinecone assistant
    try {
      console.log('Initializing Pinecone client');
      const pinecone = getPineconeClient();
      if (!pinecone) {
        console.error('Failed to initialize Pinecone client');
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }

      console.log(`Creating Pinecone No-Show with name: ${pinecone_name}`);
      const assistant = pinecone.Assistant(pinecone_name);
      if (!assistant) {
        console.error('Failed to create Pinecone No-Show');
        return NextResponse.json({ error: 'Failed to create No-Show' }, { status: 500 });
      }

      // Prepare chat messages with optional system override
      const messages = [];
      
      // Create behavior prompt if this is the first message (no systemOverride provided)
      if (!systemOverride) {
        // Generate a system prompt that enforces our desired behaviors
        const behaviorPrompt = generateBehaviorPrompt(assistantName, params);
        messages.push({ role: 'assistant', content: behaviorPrompt });
      } else {
        // Use the provided system override
        messages.push({ role: 'assistant', content: systemOverride });
      }
      
      // Add user message
      messages.push({ role: 'user', content: message });
      
      console.log('Sending message to No-Show for processing...');
      console.log(`Messages: ${JSON.stringify(messages)}`);

      // Try sending the message with detailed error logging
      let response;
      try {
        response = await assistant.chat({ messages });
        console.log('Received response from No-Show');
      } catch (assistantError: unknown) {
        console.error('Error from Pinecone assistant chat:', assistantError);
        const errorMessage = assistantError instanceof Error ? assistantError.message : String(assistantError);
        throw new Error(`Failed to get response from No-Show: ${errorMessage}`);
      }
      
      // Record the response timestamp
      const responseTimestamp = new Date();
      const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds
      console.log(`Response time: ${responseDuration}ms`);
      
      if (!response || !response.message) {
        console.error('No-Show returned no response');
        return NextResponse.json({ error: 'No-Show returned no response' }, { status: 500 });
      }

      // Track the outgoing message (only if it's not going to SMS - those are tracked in the webhook)
      if (!userPhone) {
        await trackUsage(assistantId, UsageType.MESSAGE_SENT);
        console.log(`Tracked direct web response for No-Show ${assistantId}`);
      }

      // Log the response content
      console.log(`No-Show response: "${response.message?.content?.substring(0, 100)}${(response.message?.content?.length || 0) > 100 ? '...' : ''}"`);

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
        console.error('Error updating No-Show usage:', usageError);
      } else {
        console.log('Successfully updated No-Show usage statistics');
      }

      console.log(`[${responseTimestamp.toISOString()}] No-Show chat API completed successfully`);
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
      console.error('Error interacting with No-Show:', assistantError);
      return NextResponse.json(
        { error: 'Failed to process request with the No-Show' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
