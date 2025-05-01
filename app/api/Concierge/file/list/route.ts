import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { getPineconeClient, PineconeConnectionError, PineconeNotFoundError } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

// Create a simple logger for consistent error reporting
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[FILE-LIST] INFO: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[FILE-LIST] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[FILE-LIST] WARNING: ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[FILE-LIST] DEBUG: ${message}`, data || '');
  }
};

/**
 * Handles file listing API requests
 * Uses Pinecone SDK v5.x (2025-01 API) with proper error handling
 */
export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, pinecone_name } = body;
    
    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing No-Show id' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // If pinecone_name wasn't provided in the request, fetch it from the database
    let assistantPineconeName = pinecone_name;
    
    if (!assistantPineconeName) {
      // Fetch the assistant details from the database
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select('pinecone_name')
        .eq('id', assistantId)
        .single();
      
      if (assistantError || !assistantData) {
        logger.error('Error fetching No-Show:', assistantError);
        return NextResponse.json({ error: 'No-Show not found' }, { status: 404 });
      }
      
      assistantPineconeName = assistantData.pinecone_name;
      if (!assistantPineconeName) {
        return NextResponse.json({ error: 'Invalid assistant configuration' }, { status: 500 });
      }
    }
    
    // Initialize Pinecone client with retry logic
    logger.debug('Initializing Pinecone client');
    const pinecone = getPineconeClient();
    if (!pinecone) {
      logger.error('Pinecone client initialization failed');
      return NextResponse.json({ 
        error: 'Pinecone client initialization failed',
        details: 'Unable to connect to knowledge base service' 
      }, { status: 500 });
    }

    // Try to list files with manual retry logic for extra resilience
    const maxRetries = 2; // We already have retry in the client, this is just extra insurance
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Attempt ${attempt + 1}/${maxRetries + 1} to list files for assistant: ${assistantPineconeName}`);
        
        // Create the assistant instance and list files
        const assistant = pinecone.Assistant(assistantPineconeName);
        const files = await assistant.listFiles();
        
        // Success, return the files
        logger.info(`Successfully fetched ${files.files?.length || 0} files for assistant ${assistantPineconeName}`);
        return NextResponse.json({ files });
      
      } catch (error: any) {
        lastError = error;
        
        // Handle specific Pinecone error types
        if (error instanceof PineconeNotFoundError) {
          // Not found errors won't be resolved with retries
          logger.error(`Assistant not found: ${assistantPineconeName}`, error);
          return NextResponse.json({ 
            error: 'No-Show configuration not found',
            details: `The Pinecone assistant "${assistantPineconeName}" was not found`
          }, { status: 404 });
        }
        
        if (error instanceof PineconeConnectionError) {
          // Connection issues might resolve with retries
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt); // Exponential backoff
            logger.warn(`Connection error, retrying in ${delay}ms...`, {
              attempt: attempt + 1,
              maxRetries: maxRetries + 1,
              error: error.message
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Don't retry other types of errors or if we've exhausted retries
        logger.error(`Failed to list files after ${attempt + 1} attempts`, error);
        
        // If we've reached here, we've either exhausted retries or encountered a non-retriable error
        break;
      }
    }
    
    // If we get here, all retries failed
    // Format user-friendly error message based on the last error
    let errorMessage = 'Failed to list files';
    let errorDetails = lastError?.message || 'Unknown error occurred';
    let statusCode = 500;
    
    if (lastError instanceof PineconeConnectionError) {
      errorMessage = 'Connection to knowledge base failed';
      errorDetails = 'The knowledge base service is temporarily unavailable. Please try again later.';
    } else if (lastError?.code === 'ETIMEDOUT' || lastError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = 'Connection timed out';
      errorDetails = 'The request to the knowledge base service timed out. Please try again later.';
    }
    
    // Return user-friendly error response
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails
    }, { status: statusCode });
    
  } catch (e: any) {
    // Handle unexpected errors
    logger.error('Unexpected server error:', e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: e.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}