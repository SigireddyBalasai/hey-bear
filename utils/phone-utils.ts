/**
 * Phone number utility functions
 */

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
    return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
  }
  return phoneNumber;
}

/**
 * Get country name from phone number
 */
export function getCountryFromNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('+1')) return 'United States/Canada';

  // Get country code for international numbers
  const countryCode = phoneNumber.substring(0, 3); // +XX format
  return `International (${countryCode})`;
}

/**
 * Format country from phone number for display badges
 */
export function formatCountryFromNumber(phoneNumber: string): string {
  return getCountryFromNumber(phoneNumber);
}

/**
 * Validate phone number format (E.164)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(phoneNumber);
}
