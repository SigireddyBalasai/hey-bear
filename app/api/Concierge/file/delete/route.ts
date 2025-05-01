import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient, PineconeConnectionError, PineconeNotFoundError } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

// Create a simple logger for consistent error reporting
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[FILE-DELETE] INFO: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[FILE-DELETE] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[FILE-DELETE] WARNING: ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[FILE-DELETE] DEBUG: ${message}`, data || '');
  }
};

/**
 * API route to delete files from a Pinecone assistant
 * Uses proper error handling and retry logic based on Pinecone docs
 */
export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, pinecone_name, fileId } = body;
    
    if (!assistantId || !fileId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get pinecone_name if not provided
    let assistantPineconeName = pinecone_name;
    
    if (!assistantPineconeName) {
      // Fetch the assistant from the database
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
        return NextResponse.json({ error: 'Invalid No-Show configuration' }, { status: 500 });
      }
    }

    // Initialize Pinecone client
    logger.info(`Initializing Pinecone client for assistant: ${assistantPineconeName}`);
    const pinecone = getPineconeClient();
    if (!pinecone) {
      logger.error('Pinecone client initialization failed');
      return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
    }

    // Apply retry logic for file deletion
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        logger.info(`Attempting to delete file ${fileId} (attempt ${attempt + 1}/${maxRetries})`);
        
        // Create assistant instance and delete file
        const assistant = pinecone.Assistant(assistantPineconeName);
        await assistant.deleteFile(fileId);
        
        // If successful, return positive response
        logger.info(`File deletion initiated successfully: ${fileId}`);
        return NextResponse.json({ 
          message: 'File deletion initiated',
          fileId,
          status: 'deleting'
        });
      } catch (error: any) {
        lastError = error;
        
        // Handle different error types
        if (error instanceof PineconeNotFoundError) {
          // If file or assistant doesn't exist, no need to retry
          logger.error(`Resource not found for deletion: ${fileId}`, error);
          
          // Check if the error indicates file not found vs assistant not found
          const errorMessage = error.message?.toLowerCase() || '';
          if (errorMessage.includes('file') && errorMessage.includes('not found')) {
            // File not found - could be already deleted
            return NextResponse.json({ 
              message: 'File not found or already deleted',
              fileId
            }, { status: 404 });
          } else {
            // Assistant not found
            return NextResponse.json({ 
              error: 'No-Show configuration not found',
              details: `The Pinecone assistant "${assistantPineconeName}" was not found`
            }, { status: 404 });
          }
        }
        
        // For connection errors, retry with exponential backoff
        if (error instanceof PineconeConnectionError && attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt);
          logger.warn(`Connection error on attempt ${attempt + 1}, retrying in ${delay}ms...`, {
            error: error.message,
            fileId
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or last attempt, log and break
        logger.error(`Failed to delete file on attempt ${attempt + 1}/${maxRetries}:`, error);
        break;
      }
    }
    
    // If we reach here, all retries failed
    logger.error('All deletion attempts failed', lastError);
    
    // Format user-friendly error based on the type
    let errorMessage = 'Failed to delete file';
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
    
  } catch (e: any) {
    logger.error('Unexpected error:', e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: e.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
