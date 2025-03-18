/**
 * Utility functions for monitoring SMS messaging in Twilio
 */
import { logTwilio, logTwilioError } from './twilio-logger';

/**
 * Logs details of an outgoing SMS message
 */
export function logOutgoingSms(to: string, from: string, message: string, metadata?: any) {
  const truncatedMessage = message.length > 100 
    ? `${message.substring(0, 97)}...` 
    : message;
  
  logTwilio('OutgoingSMS', `To: ${to}, From: ${from}, Message: ${truncatedMessage}`, metadata);
}

/**
 * Logs details of an incoming SMS message
 */
export function logIncomingSms(from: string, to: string, message: string, metadata?: any) {
  const truncatedMessage = message.length > 100 
    ? `${message.substring(0, 97)}...` 
    : message;
  
  logTwilio('IncomingSMS', `From: ${from}, To: ${to}, Message: ${truncatedMessage}`, metadata);
}

/**
 * Check if a message appears to contain common SMS error patterns
 */
export function checkSmsErrorPatterns(message: string): { hasErrors: boolean, errors: string[] } {
  const errors: string[] = [];
  
  // Common error patterns
  if (message.includes('Error ') || message.includes('Failed to ') || 
      message.includes('unable to ') || message.includes('cannot be ')) {
    errors.push('Contains error language');
  }
  
  if (message.length > 1600) {
    errors.push('Message exceeds 1600 character limit');
  }
  
  // Check for potentially problematic characters
  if (/[^\w\s.,?!;:()\-@#']/.test(message)) {
    errors.push('Contains potential special characters that may affect delivery');
  }
  
  return {
    hasErrors: errors.length > 0,
    errors
  };
}

/**
 * Sanitize a message for SMS delivery - Less aggressive version
 * We need to preserve more characters for proper SMS delivery
 */
export function sanitizeForSms(message: string): string {
  if (!message) return '';
  
  try {
    // Basic sanitization - only remove XML-unsafe characters
    let sanitized = message
      .replace(/&/g, '&amp;')   // XML encoding for &
      .replace(/</g, '&lt;')    // XML encoding for <
      .replace(/>/g, '&gt;')    // XML encoding for >
      .trim();
    
    // Truncate if too long
    if (sanitized.length > 1600) {
      sanitized = sanitized.substring(0, 1597) + '...';
    }
    
    return sanitized;
  } catch (error) {
    logTwilioError('SMS', 'Error sanitizing SMS message', error);
    return message; // Return original if sanitization fails
  }
}
