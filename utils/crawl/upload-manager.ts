import { NextResponse } from 'next/server';

import type { Assistant } from '@pinecone-database/pinecone';

import type { Json } from '@/lib/db.types';
import { getPineconeClient } from '@/lib/pinecone';

import type { RequestBody } from './firecrawl-types';

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
    resultData: {
      url?: string;
      title?: string;
      content?: string;
      metadata?: Record<string, Json>;
    }
  ): Promise<{ id: string }> {
    const pinecone = getPineconeClient();

    if (!pinecone) {
      throw new Error('Pinecone client initialization failed');
    }

    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const pineconeAssistant = pinecone.Assistant(pinecone_name);

        if (attempt === 0) {
          await this.validateAssistant(pineconeAssistant);
        }

        return await this.performUpload(
          pineconeAssistant,
          tempFilePath,
          url,
          assistantId,
          userId,
          resultData
        );
      } catch (uploadError: unknown) {
        lastError = uploadError;

        if (this.shouldRetry(uploadError, attempt)) {
          await this.waitForRetry(attempt);
        } else {
          throw uploadError;
        }
      }
    }

    throw lastError ?? new Error('Failed to upload to Pinecone after multiple attempts');
  }

  /**
   * Performs the actual upload to Pinecone
   */
  private async performUpload(
    pineconeAssistant: Assistant,
    tempFilePath: string,
    url: string,
    assistantId: string,
    userId: string,
    resultData: {
      url?: string;
      title?: string;
      content?: string;
      metadata?: Record<string, Json>;
    }
  ): Promise<{ id: string }> {
    const metadata = this.buildUploadMetadata(url, assistantId, userId, resultData);

    return await pineconeAssistant.uploadFile({
      path: tempFilePath,
      metadata,
    });
  }

  /**
   * Builds metadata for upload
   */
  private buildUploadMetadata(
    url: string,
    assistantId: string,
    userId: string,
    resultData: {
      url?: string;
      title?: string;
      content?: string;
      metadata?: Record<string, Json>;
    }
  ): Record<string, string> {
    return {
      source: url,
      type: 'webpage',
      dateAdded: new Date().toISOString(),
      assistantId,
      userId,
      title: this.extractMetadataField(resultData, 'title'),
      description: this.extractMetadataField(resultData, 'description'),
    };
  }

  /**
   * Safely extracts metadata field
   */
  private extractMetadataField(
    resultData: {
      metadata?: Record<string, Json>;
    },
    field: string
  ): string {
    if (
      resultData?.metadata &&
      typeof resultData.metadata === 'object' &&
      Object.prototype.hasOwnProperty.call(resultData.metadata, field) &&
      typeof resultData.metadata[field] === 'string'
    ) {
      return String(resultData.metadata[field]);
    }

    return '';
  }

  /**
   * Determines if upload should be retried
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    const isConnectionError =
      error instanceof PineconeConnectionError ||
      (error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'UND_ERR_CONNECT_TIMEOUT');

    return Boolean(isConnectionError && attempt < this.maxRetries - 1);
  }

  /**
   * Waits before retry with exponential backoff
   */
  private async waitForRetry(attempt: number): Promise<void> {
    const delay = this.initialRetryDelay * Math.pow(2, attempt);

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Validates that a Pinecone assistant exists
   */
  private async validateAssistant(pineconeAssistant: Assistant): Promise<void> {
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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CrawlErrorHandler {
  /**
   * Creates appropriate error responses based on error type
   */
  static handleError(error: unknown): NextResponse {
    const errorMessage = this.extractErrorMessage(error);
    const errorDetails = this.buildErrorDetails(error, errorMessage);
    const { userMessage, statusCode } = this.determineUserResponse(error);

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

  /**
   * Extracts error message from unknown error type
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return 'An error occurred during content upload';
  }

  /**
   * Builds error details object
   */
  private static buildErrorDetails(error: unknown, message: string) {
    return {
      message,
      type: error instanceof Error ? (error.name ?? 'UnknownError') : 'UnknownError',
      cause: error instanceof Error && error.cause ? String(error.cause) : undefined,
    };
  }

  /**
   * Determines user-friendly message and status code
   */
  private static determineUserResponse(error: unknown): {
    userMessage: string;
    statusCode: number;
  } {
    if (error instanceof PineconeConnectionError) {
      return {
        userMessage:
          'Unable to connect to the Pinecone service. The service might be temporarily unavailable.',
        statusCode: 500,
      };
    }

    if (error instanceof PineconeNotFoundError) {
      return {
        userMessage: 'The assistant configuration is invalid. Please contact support.',
        statusCode: 400,
      };
    }

    if (this.isTimeoutError(error)) {
      return {
        userMessage: 'Connection to the knowledge base timed out. Please try again later.',
        statusCode: 500,
      };
    }

    return {
      userMessage: 'Failed to upload URL content',
      statusCode: 500,
    };
  }

  /**
   * Checks if error is a timeout error
   */
  private static isTimeoutError(error: unknown): boolean {
    const isConnRefused =
      error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED';
    const isTimeoutMessage =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('timeout');

    return Boolean(isConnRefused ?? isTimeoutMessage);
  }
}
