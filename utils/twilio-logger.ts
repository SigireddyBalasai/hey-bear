/**
 * A utility for structured logging of Twilio-related operations
 */

/**
 * Log a message with a Twilio context and timestamp
 */
export function logTwilio(context: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logPrefix = `[TWILIO][${context}][${timestamp}]`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, data);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
}

/**
 * Log an error with a Twilio context and timestamp
 */
export function logTwilioError(context: string, message: string, error?: any) {
  const timestamp = new Date().toISOString();
  const logPrefix = `[TWILIO-ERROR][${context}][${timestamp}]`;
  
  if (error) {
    console.error(`${logPrefix} ${message}`, error);
    
    // Extract additional Twilio-specific error information if available
    if (error.code) {
      console.error(`${logPrefix} Twilio Error Code: ${error.code}`);
    }
    if (error.moreInfo) {
      console.error(`${logPrefix} Twilio Error Info URL: ${error.moreInfo}`);
    }
    if (error.status) {
      console.error(`${logPrefix} HTTP Status: ${error.status}`);
    }
  } else {
    console.error(`${logPrefix} ${message}`);
  }
}

/**
 * Format an incoming Twilio webhook request for logging
 */
export function formatTwilioWebhook(formData: FormData, url: string, isVoice: boolean = false) {
  const params = Object.fromEntries(formData.entries());
  const type = isVoice ? 'VOICE' : 'SMS';
  
  return {
    type,
    url,
    params: {
      ...params,
      // Don't log full message body in production to avoid logging sensitive data
      Body: params.Body ? `${String(params.Body).substring(0, 50)}${String(params.Body).length > 50 ? '...' : ''}` : undefined
    }
  };
}

/**
 * Format a Twilio TwiML response for logging
 */
export function logTwimlResponse(twiml: string) {
  // Clean up the TwiML for logging by removing line breaks
  const cleanTwiml = twiml.replace(/\s+/g, ' ').trim();
  const shortTwiml = cleanTwiml.length > 200 
    ? `${cleanTwiml.substring(0, 197)}...` 
    : cleanTwiml;
  
  logTwilio('TwiML', `Generated response: ${shortTwiml}`);
  logTwilio('TwiML', `Response length: ${twiml.length} chars`);
}
