import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient, PineconeConnectionError, PineconeNotFoundError } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { UploadFileOptions } from '@pinecone-database/pinecone';

// Create a simple logger for consistent error reporting
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[FILE-UPLOAD] INFO: ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[FILE-UPLOAD] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[FILE-UPLOAD] WARNING: ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[FILE-UPLOAD] DEBUG: ${message}`, data || '');
  }
};

// List of allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/x-python',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint', // ppt
];

/**
 * File upload handler for Pinecone assistants
 * Implements retry logic and proper error handling
 */
export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const providedPineconeName = formData.get('pinecone_name') as string;
    const file = formData.get('file') as File;

    if (!assistantId || !file) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      logger.warn(`Rejected file of type: ${file.type || 'unknown'}`);
      return NextResponse.json({
        error: 'Invalid file type',
        details: `File type "${file.type || 'unknown'}" is not supported. Allowed types: PDF, TXT, MD, CSV, HTML, Python, Word documents, and PowerPoint presentations.`
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get pinecone_name if not provided
    let pinecone_name = providedPineconeName;
    
    if (!pinecone_name) {
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
      
      pinecone_name = assistantData.pinecone_name || '';
      if (!pinecone_name) {
        return NextResponse.json({ error: 'Invalid assistant configuration' }, { status: 500 });
      }
    }
    
    // Get Pinecone client
    logger.info(`Initializing Pinecone client for assistant: ${pinecone_name}`);
    const pinecone = getPineconeClient();
    if (!pinecone) {
      logger.error('Pinecone client initialization failed');
      return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
    }
    
    // Save file to temp location
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, file.name);
    const buffer = await file.arrayBuffer();
    
    logger.debug(`Writing file to temporary path: ${tempFilePath}`);
    await fs.writeFile(tempFilePath, Buffer.from(buffer));
      
    // Retry configuration
    const maxRetries = 3;
    const initialRetryDelay = 1000; // 1 second
    let lastError = null;
    
    // Try to upload with retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        logger.info(`Attempting to upload file (attempt ${attempt + 1}/${maxRetries}): ${file.name}`);
        
        // Create Pinecone assistant instance for this attempt
        const assistant = pinecone.Assistant(pinecone_name);
        
        // Add metadata for better tracking
        const uploadResult = await assistant.uploadFile({
          path: tempFilePath,
          metadata: {
            originalName: file.name,
            mimeType: file.type,
            size: String(file.size), // Convert number to string to match metadata type requirements
            uploadedBy: user.id,
            uploadTimestamp: new Date().toISOString(),
            assistantId: assistantId
          }
        } as unknown as UploadFileOptions);
        
        // If upload succeeded, clean up and return success
        logger.info(`File uploaded successfully with ID: ${uploadResult.id}`);
        
        // Clean up temporary file
        if (tempFilePath) {
          await fs.unlink(tempFilePath)
            .catch(err => logger.warn(`Error deleting temp file: ${tempFilePath}`, err));
          tempFilePath = null;
        }
        
        return NextResponse.json({ 
          message: 'File uploaded successfully',
          fileId: uploadResult.id,
          filename: file.name
        });
      } catch (uploadError: any) {
        lastError = uploadError;
        
        // Special check for unsupported file types from Pinecone
        if (uploadError.message && (
            uploadError.message.includes('Invalid file type') || 
            uploadError.message.includes('unsupported file')
        )) {
          logger.warn('File type rejected by Pinecone:', { 
            error: uploadError.message, 
            fileName: file.name, 
            type: file.type 
          });
          
          // Clean up temporary file
          if (tempFilePath) {
            await fs.unlink(tempFilePath)
              .catch(err => logger.warn(`Error deleting temp file: ${tempFilePath}`, err));
            tempFilePath = null;
          }
          
          return NextResponse.json({
            error: 'Invalid file type',
            details: 'This file type is not supported by the knowledge base. Please try a different format like PDF, TXT, or DOCX.'
          }, { status: 400 });
        }
        
        // Handle notFound errors - no point retrying
        if (uploadError instanceof PineconeNotFoundError) {
          logger.error(`Pinecone assistant not found: ${pinecone_name}`, uploadError);
          
          // Clean up temporary file
          if (tempFilePath) {
            await fs.unlink(tempFilePath)
              .catch(err => logger.warn(`Error deleting temp file: ${tempFilePath}`, err));
            tempFilePath = null;
          }
          
          return NextResponse.json({
            error: 'No-Show configuration not found',
            details: `The Pinecone assistant "${pinecone_name}" was not found`
          }, { status: 404 });
        }
        
        // For connection errors, retry with exponential backoff
        if ((uploadError instanceof PineconeConnectionError || 
             uploadError.code === 'ETIMEDOUT' || 
             uploadError.code === 'UND_ERR_CONNECT_TIMEOUT') && 
            attempt < maxRetries - 1) {
          
          const delay = initialRetryDelay * Math.pow(2, attempt);
          logger.warn(`Connection error, retrying in ${delay}ms...`, {
            attempt: attempt + 1,
            fileName: file.name,
            error: uploadError.message
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or on last attempt, break and report failure
        logger.error(`Upload failed on attempt ${attempt + 1}/${maxRetries}:`, uploadError);
        break;
      }
    }
    
    // If we reach here, all upload attempts failed
    // Clean up temporary file
    if (tempFilePath) {
      await fs.unlink(tempFilePath)
        .catch(err => logger.warn(`Error deleting temp file: ${tempFilePath}`, err));
      tempFilePath = null;
    }
    
    // Format user-friendly error based on the type
    let errorMessage = 'Failed to upload file';
    let errorDetails = lastError?.message || 'An error occurred during file upload';
    let statusCode = 500;
    
    if (lastError instanceof PineconeConnectionError) {
      errorMessage = 'Connection to knowledge base failed';
      errorDetails = 'The knowledge base service is temporarily unavailable. Please try again later.';
    } else if (lastError?.code === 'ETIMEDOUT' || lastError?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = 'Connection timed out';
      errorDetails = 'The request to the knowledge base service timed out. Please try again later.';
    }
    
    logger.error('All upload attempts failed:', {
      fileName: file.name,
      errorType: lastError?.name || 'Unknown',
      errorMessage: lastError?.message || 'Unknown error'
    });
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: statusCode });
  } catch (e: any) {
    // Clean up temporary file in case of unexpected errors
    if (tempFilePath) {
      await fs.unlink(tempFilePath)
        .catch(err => logger.warn(`Error deleting temp file: ${tempFilePath}`, err));
    }
    
    logger.error('Unexpected error:', e);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: e.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
