import { createClient } from '@/utils/supabase/server';
import { ApiResponse, createErrorResponse } from '../types/api-response';

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface ServiceResponse<T = any> extends ApiResponse<T> {
  status: number;
}

/**
 * Base service class with common functionality for all services
 */
export class BaseService {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Verify the user is authenticated
   * @returns Object containing user if authenticated, or error if not
   */
  protected async verifyAuthentication(): Promise<{user?: any, error?: string, status?: number}> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user };
  }

  /**
   * Format error response
   * @param error The error object or message
   * @param message Custom error prefix message
   * @returns Formatted ServiceResponse with error details
   */
  protected formatError(error: unknown, message: string): ServiceResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: `${message}: ${errorMessage}`,
      status: 500,
      success: false
    };
  }

  /**
   * Create a standardized service success response
   */
  protected createSuccessResponse<T>(
    data?: T, 
    message?: string, 
    status: number = 200
  ): ServiceResponse<T> {
    return {
      data,
      message,
      status,
      success: true,
      error: null
    };
  }

  /**
   * Create a standardized service error response
   */
  protected createErrorResponse(
    error: string,
    status: number = 400,
    data?: any
  ): ServiceResponse {
    return {
      error,
      status,
      data,
      success: false
    };
  }

  /**
   * Create a standardized service warning response (partial success)
   */
  protected createWarningResponse<T>(
    data: T,
    warning: string,
    status: number = 207,
    message?: string
  ): ServiceResponse<T> {
    return {
      data,
      warning,
      message,
      status,
      success: true,
      error: null
    };
  }
}