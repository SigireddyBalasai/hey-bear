export function sanitizeForSms(message: string): string {
  // Basic sanitization: remove XML/HTML tags and trim whitespace.
  // More sophisticated sanitization might be needed depending on requirements.
  let sanitized = message.replace(/<[^>]*>/g, '').trim();
  // Ensure the message is not overly long for SMS (though Twilio handles segmentation)
  if (sanitized.length > 1600) {
    sanitized = sanitized.substring(0, 1597) + '...';
  }
  return sanitized;
}
