export function formatPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
    return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
  }

  return phoneNumber;
}

export function getCountryFromNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('+1')) return 'United States/Canada';

  // Get country code for international numbers
  const countryCode = phoneNumber.substring(0, 3); // +XX format

  return `International (${countryCode})`;
}

export function formatCountryFromNumber(phoneNumber: string): string {
  return getCountryFromNumber(phoneNumber);
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format

  return phoneRegex.test(phoneNumber);
}
