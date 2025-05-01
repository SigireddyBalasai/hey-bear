import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient, PineconeConnectionError, PineconeNotFoundError } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/lib/db.types';
import { checkAssistantSubscription } from '@/utils/subscriptions';
import { trackUsage, isLimitReached, UsageType } from '@/utils/usage-limits';

// Define table types for better type safety
type Interactions = Tables<'interactions'>
type Assistant = Tables<'assistants'>

// Logger for consistent error reporting
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[CHAT] INFO: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[CHAT] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[CHAT] WARNING: ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[CHAT] DEBUG: ${message}`, data || '');
  }
};

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

/**
 * Chat API endpoint with Pinecone integration
 * Optimized with retry logic and improved error handling
 */
export async function POST(req: NextRequest) {
  // Record the request timestamp
  const requestTimestamp = new Date();
  logger.info(`No-Show chat API called at ${requestTimestamp.toISOString()}`);
  
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      logger.error('Invalid JSON in request body');
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, message, systemOverride, userPhone } = body;
    logger.debug(`Request parameters: assistantId=${assistantId}, message length=${message?.length || 0}`);
    
    if (systemOverride) {
      logger.debug(`System override provided: "${systemOverride.substring(0, 50)}..."`);
    }
    
    if (userPhone) {
      logger.debug(`User phone: ${userPhone}`);
    }
    
    // Validate required fields
    if (!assistantId || !message) {
      logger.error(`Missing required fields: assistantId=${!!assistantId}, message=${!!message}`);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if the assistant has an active subscription
    const subscriptionCheck = await checkAssistantSubscription(assistantId);
    if (!subscriptionCheck.isActive) {
      logger.error(`Subscription check failed: ${subscriptionCheck.error}`, subscriptionCheck);
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
      logger.warn(`Message limit reached for No-Show ${assistantId}`);
      return NextResponse.json({
        error: 'Usage limit reached',
        details: 'This No-Show has reached its monthly message limit. Please upgrade your plan or wait until next month to continue the conversation.',
        limitReached: true
      }, { status: 429 }); // 429 Too Many Requests
    }
    
    // Track the incoming message (only if it's not coming from an SMS - those are tracked in the webhook)
    if (!userPhone) {
      await trackUsage(assistantId, UsageType.MESSAGE_RECEIVED);
      logger.info(`Tracked direct web message for No-Show ${assistantId}`);
    }
    
    const supabase = await createClient();

    // Fetch the assistant from the database to get its Pinecone name
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('pinecone_name, name, params')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      logger.error('Error fetching No-Show:', assistantError);
      return NextResponse.json({ error: 'No-Show not found' }, { status: 404 });
    }
    const { pinecone_name, name: assistantName, params } = assistantData;
    logger.info(`Using No-Show: name=${assistantName}, pinecone_name=${pinecone_name}`);
    
    if (!pinecone_name) {
      logger.error('Missing Pinecone name for No-Show');
      return NextResponse.json({ error: 'Invalid No-Show configuration: missing Pinecone name' }, { status: 500 });
    }

    // Initialize Pinecone client
    const pinecone = getPineconeClient();
    if (!pinecone) {
      logger.error('Failed to initialize Pinecone client');
      return NextResponse.json({ error: 'Knowledge base service initialization failed' }, { status: 500 });
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
    
    logger.debug('Messages prepared for No-Show');

    // Apply retry logic for chat requests
    const maxRetries = 3;
    const initialRetryDelay = 1000; // 1 second
    let response;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        logger.info(`Sending message to No-Show (attempt ${attempt + 1}/${maxRetries})`);
        
        // Create assistant instance for each attempt to avoid connection reuse issues
        const assistant = pinecone.Assistant(pinecone_name);
        if (!assistant) {
          throw new Error('Failed to create No-Show instance');
        }
        
        // Send message to assistant
        response = await assistant.chat({ messages });
        
        // If we got here, the request was successful
        logger.info(`Received response from No-Show on attempt ${attempt + 1}`);
        break;
        
      } catch (error: any) {
        lastError = error;
        
        // Handle different types of errors
        if (error instanceof PineconeNotFoundError) {
          // Assistant not found - no reason to retry
          logger.error(`Pinecone assistant not found: ${pinecone_name}`, error);
          return NextResponse.json({ 
            error: 'No-Show configuration not found', 
            details: `The No-Show "${pinecone_name}" does not exist`
          }, { status: 404 });
        }
        
        // For connection errors, retry with exponential backoff
        if ((error instanceof PineconeConnectionError || 
             error.code === 'UND_ERR_CONNECT_TIMEOUT' || 
             error.message?.includes('timeout')) && 
            attempt < maxRetries - 1) {
          
          const delay = initialRetryDelay * Math.pow(2, attempt);
          logger.warn(`Connection error on attempt ${attempt + 1}, retrying in ${delay}ms...`, {
            error: error.message
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or on last attempt, log and break
        logger.error(`Chat failed on attempt ${attempt + 1}/${maxRetries}:`, error);
        break;
      }
    }
    
    // If all retries failed
    if (!response || !response.message) {
      logger.error('All chat attempts failed', lastError);
      
      // Format user-friendly error based on error type
      let errorMessage = 'Failed to get response from the No-Show';
      let statusCode = 500;
      
      if (lastError instanceof PineconeConnectionError) {
        errorMessage = 'Connection to knowledge base failed. Please try again later.';
      } else if (lastError?.code === 'ETIMEDOUT' || lastError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        errorMessage = 'Connection timed out. The service might be temporarily unavailable.';
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: lastError?.message || 'Unknown error occurred'
      }, { status: statusCode });
    }
      
    // Record the response timestamp
    const responseTimestamp = new Date();
    const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds
    logger.info(`Response time: ${responseDuration}ms`);

    // Track the outgoing message (only if it's not going to SMS - those are tracked in the webhook)
    if (!userPhone) {
      await trackUsage(assistantId, UsageType.MESSAGE_SENT);
      logger.info(`Tracked direct web response for No-Show ${assistantId}`);
    }

    // Extract token usage and cost information from the response if available
    const tokenCount = response.usage?.totalTokens || 0
    // Simple cost estimation (adjust the rate based on your actual pricing)
    const costRate = 0.002 / 1000; // Example: $0.002 per 1000 tokens
    const costEstimate = tokenCount * costRate;
    logger.debug(`Token usage: ${tokenCount} tokens (prompt: ${response.usage?.promptTokens || 'N/A'}, completion: ${response.usage?.completionTokens || 'N/A'})`);

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
      logger.error('Error saving interaction to Supabase:', interactionError);
    } else {
      logger.debug('Successfully saved interaction to Supabase');
    }
    
    // Update assistant usage statistics
    const { error: usageError } = await supabase
      .from('assistants')
      .update({
        // Only use fields that exist in the assistants table schema
        params: {
          ...(typeof params === 'object' ? params : {}),
          last_used_at: requestTimestamp.toISOString()
        }
      })
      .eq('id', assistantId);

    if (usageError) {
      logger.error('Error updating No-Show usage:', usageError);
    }

    logger.info(`No-Show chat API completed successfully in ${responseDuration}ms`);
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
  } catch (e: any) {
    logger.error('Unexpected server error:', e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: e.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
