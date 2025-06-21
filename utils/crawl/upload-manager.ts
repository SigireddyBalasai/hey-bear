import { NextResponse } from 'next/server';

import type { RequestBody } from './firecrawl-types';

import { getPineconeClient } from '@/lib/pinecone';


// Define custom error classes for Pinecone operations
export class PineconeConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeConnectionError';
  }
}

export class PineconeNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeNotFoundError';
  }
}

/**
 * Upload manager for handling file uploads to Pinecone with retry logic
 */
export class PineconeUploadManager {
  private readonly maxRetries = 3;
  private readonly initialRetryDelay = 1000;

  /**
   * Uploads content to Pinecone with retry logic for connection errors
   */
  async uploadWithRetry(
    tempFilePath: string,
    pinecone_name: string,
    url: string,
    assistantId: string,
    userId: string,
    resultData: unknown
  ): Promise<{ id: string }> {
    const pinecone = getPineconeClient();

    if (!pinecone) {
      throw new Error('Pinecone client initialization failed');
    }

    let uploadResult = null;
    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Create a new Pinecone Assistant instance each time to avoid connection reuse issues
        const pineconeAssistant = pinecone.Assistant(pinecone_name);

        // Validate assistant existence on first attempt
        if (attempt === 0) {
          await this.validateAssistant(pineconeAssistant);
        }

        // Upload the file
        uploadResult = await pineconeAssistant.uploadFile({
          path: tempFilePath,
          metadata: {
            source: url,
            type: 'webpage',
            dateAdded: new Date().toISOString(),
            assistantId,
            userId,
            title:
              resultData &&
              typeof resultData === 'object' &&
              'metadata' in resultData &&
              resultData.metadata &&
              typeof resultData.metadata === 'object' &&
              'title' in resultData.metadata &&
              typeof resultData.metadata.title === 'string'
                ? resultData.metadata.title
                : '',
            description:
              resultData &&
              typeof resultData === 'object' &&
              'metadata' in resultData &&
              resultData.metadata &&
              typeof resultData.metadata === 'object' &&
              'description' in resultData.metadata &&
              typeof resultData.metadata.description === 'string'
                ? resultData.metadata.description
                : '',
          },
        });

        // If we get here, upload was successful
        return uploadResult;
      } catch (uploadError: unknown) {
        lastError = uploadError;

        // Check error type to determine if we should retry
        if (
          (uploadError instanceof PineconeConnectionError ||
            (uploadError &&
              typeof uploadError === 'object' &&
              'code' in uploadError &&
              uploadError.code === 'UND_ERR_CONNECT_TIMEOUT')) &&
          attempt < this.maxRetries - 1
        ) {
          // Only retry on connection errors, not other types
          // Exponential backoff
          await new Promise(r => setTimeout(r, this.initialRetryDelay * Math.pow(2, attempt)));
        } else {
          // Either not a connection error or last attempt
          throw uploadError;
        }
      }
    }

    throw lastError || new Error('Failed to upload to Pinecone after multiple attempts');
  }

  /**
   * Validates that a Pinecone assistant exists
   */
  private async validateAssistant(pineconeAssistant: unknown): Promise<void> {
    try {
      if (
        pineconeAssistant &&
        typeof pineconeAssistant === 'object' &&
        'listFiles' in pineconeAssistant &&
        typeof pineconeAssistant.listFiles === 'function'
      ) {
        await pineconeAssistant.listFiles();
      } else {
        throw new Error('Invalid Pinecone assistant object');
      }
    } catch (verifyError: unknown) {
      if (verifyError instanceof PineconeNotFoundError) {
        throw verifyError;
      }
      // For other errors, continue as they may resolve with retries
    }
  }
}

/**
 * Request validator for URL crawling requests
 */
export class RequestValidator {
  /**
   * Validates the request body for required fields
   */
  static validateBody(body: RequestBody): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!body.assistantId) missingFields.push('assistantId');
    if (!body.pinecone_name) missingFields.push('pinecone_name');
    if (!body.url) missingFields.push('url');

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Validates URL format
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Error handler for URL crawling operations
 */
export class CrawlErrorHandler {
  /**
   * Creates appropriate error responses based on error type
   */
  static handleError(error: unknown): NextResponse {
    let errorMessage = 'An error occurred during content upload';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    }

    const errorDetails = {
      message: errorMessage,
      type: error instanceof Error ? error.name || 'Unknown' : 'Unknown',
      cause: error instanceof Error && error.cause ? String(error.cause) : undefined,
    };

    // Format user-friendly error message based on error type
    let userMessage = 'Failed to upload URL content';
    let statusCode = 500;

    if (error instanceof PineconeConnectionError) {
      userMessage =
        'Unable to connect to the Pinecone service. The service might be temporarily unavailable.';
    } else if (error instanceof PineconeNotFoundError) {
      userMessage = 'The assistant configuration is invalid. Please contact support.';
      statusCode = 400;
    } else if (
      (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') ||
      (error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string' &&
        error.message.includes('timeout'))
    ) {
      userMessage = 'Connection to the knowledge base timed out. Please try again later.';
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: `${errorDetails.type}: ${errorDetails.message}${
          errorDetails.cause ? ` (Caused by: ${errorDetails.cause})` : ''
        }`,
      },
      { status: statusCode }
    );
  }
}
