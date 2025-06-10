import { toast } from 'sonner';

/**
 * Standardized error handling utilities
 * Consolidates the repetitive error handling patterns found across the codebase
 */
import type { ErrorHandlerOptions } from '@/types/app.types';

/**
 * Generic error handler that can display toast notifications and log errors
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): string {
  const {
    showToast = true,
    toastTitle = 'Error',
    logError = true,
    fallbackMessage = 'An unexpected error occurred',
    context = '',
  } = options;

  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = fallbackMessage;
  }

  if (logError) {
    console.error(`${context ? `[${context}]` : ''} Error:`, error);
  }

  if (showToast) {
    toast.error(toastTitle, {
      description: errorMessage,
    });
  }

  return errorMessage;
}

/**
 * Async function wrapper that handles errors automatically
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, options);

    // Call the onError callback if provided
    if (options.onError && error instanceof Error) {
      options.onError(error);
    }

    return null;
  }
}

/**
 * Success toast notification helper
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}

/**
 * Info toast notification helper
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, description ? { description } : undefined);
}

/**
 * Warning toast notification helper
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, description ? { description } : undefined);
}

/**
 * Common error messages for consistency
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  GENERIC: 'An unexpected error occurred. Please try again later.',
  TIMEOUT: 'The request timed out. Please try again.',
  SERVER: 'Server error. Please try again later.',
  AUTH: 'Authentication error. Please try again or contact support.',
  PERMISSION: 'You do not have permission to perform this action.',
} as const;
