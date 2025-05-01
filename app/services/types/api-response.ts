/**
 * Base interface for API responses
 */
export interface ApiResponse<T = any> {
  /**
   * Optional data payload
   */
  data?: T;
  
  /**
   * Success message for successful operations
   */
  message?: string;
  
  /**
   * Error message in case of failure
   */
  error?: string | null;
  
  /**
   * Warning message for partial successes
   */
  warning?: string;
  
  /**
   * Boolean indicating if the operation was successful
   */
  success?: boolean;
}

/**
 * Function to create a standardized API success response
 */
export function createSuccessResponse<T>(
  data?: T, 
  message?: string
): ApiResponse<T> {
  return {
    data,
    message,
    success: true,
    error: null
  };
}

/**
 * Function to create a standardized API error response
 */
export function createErrorResponse(
  error: string,
  data?: any
): ApiResponse {
  return {
    error,
    success: false,
    data
  };
}

/**
 * Function to create a standardized API warning response (partial success)
 */
export function createWarningResponse<T>(
  data: T,
  warning: string,
  message?: string
): ApiResponse<T> {
  return {
    data,
    warning,
    message,
    success: true,
    error: null
  };
}