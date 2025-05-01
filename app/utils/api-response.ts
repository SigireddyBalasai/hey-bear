import { NextResponse } from 'next/server';
import { ApiResponse } from '../services/types/api-response';

/**
 * Create a standardized success response for API endpoints
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      data,
      message,
      success: true,
      error: null
    },
    { status }
  );
}

/**
 * Create a standardized error response for API endpoints
 */
export function createErrorResponse(
  error: string | Error,
  status = 400,
  data?: any
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return NextResponse.json(
    {
      error: errorMessage,
      success: false,
      data
    },
    { status }
  );
}

/**
 * Create a standardized warning response for API endpoints (partial success)
 */
export function createWarningResponse<T>(
  data: T,
  warning: string,
  message?: string,
  status = 207
): NextResponse {
  return NextResponse.json(
    {
      data,
      warning,
      message,
      success: true,
      error: null
    },
    { status }
  );
}

/**
 * Convert a service response to a NextResponse
 */
export function serviceResponseToNextResponse<T>(serviceResponse: {
  data?: T;
  message?: string;
  error?: string | null;
  status: number;
  warning?: string;
  success?: boolean;
}): NextResponse {
  const { data, message, error, status, warning, success } = serviceResponse;
  
  // If we have a warning, return a warning response
  if (warning) {
    return createWarningResponse(data, warning, message, status);
  }
  
  // If we have an error, return an error response
  if (error) {
    return createErrorResponse(error, status, data);
  }
  
  // Otherwise, return a success response
  return createSuccessResponse(data, message, status);
}