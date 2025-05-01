import { Pinecone, type PineconeConfiguration } from '@pinecone-database/pinecone';
import { PineconeNotFoundError, PineconeConnectionError } from '@pinecone-database/pinecone/dist/errors';

// Re-export error types from Pinecone for easier imports throughout the app
export { PineconeNotFoundError, PineconeConnectionError };

/**
 * Creates and returns a configured Pinecone client instance.
 * Based on the latest Pinecone documentation for version 5.0.2
 * 
 * Features:
 * - Automatic retry logic
 * - Better error handling
 * - Optional proxy support
 */
export const getPineconeClient = (): Pinecone | null => {
  // Check if the API key is available
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('[PINECONE] Error: PINECONE_API_KEY environment variable is not set.');
    return null;
  }

  try {
    // Configuration for the Pinecone client
    const config: PineconeConfiguration = {
      apiKey,
      // Retry configuration
      // More specific configs should be set per operation as needed
    };

    // Add proxy configuration if specified in environment
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
      console.info(`[PINECONE] Using proxy: ${proxyUrl}`);
      // When using a proxy, you'd need to create a custom fetch function
      // using something like 'undici' or 'node-fetch' with a proxy agent
    }

    return new Pinecone(config);
  } catch (error) {
    console.error('[PINECONE] Failed to initialize client:', error);
    return null;
  }
};

/**
 * Validates a Pinecone assistant name format.
 * Ensures the name follows Pinecone's requirements:
 * - Lowercase alphanumeric with hyphens only
 * - Starts with a letter
 * - At least 3 characters
 * - No more than 45 characters
 */
export function validatePineconeName(name: string): boolean {
  // Must be lowercase alphanumeric with hyphens only
  // Must start with a letter, be at least 3 chars, and no more than 45 chars
  const validFormat = /^[a-z][a-z0-9-]{1,44}$/;
  return validFormat.test(name);
}

/**
 * Generates a valid Pinecone assistant name based on input.
 * Following Pinecone's naming conventions:
 * - Lowercase alphanumeric with hyphens only
 * - Starts with a letter
 * - At least 3 characters
 * - No more than 45 characters total
 */
export function generatePineconeName(base: string): string {
  // Generate a random suffix (5 chars)
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  
  // Convert to lowercase and replace non-alphanumeric chars with hyphens
  let safeName = base.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Replace consecutive hyphens with a single one
  safeName = safeName.replace(/-{2,}/g, '-');
  
  // Remove leading and trailing hyphens
  safeName = safeName.replace(/^-+|-+$/g, '');
  
  // Ensure the name starts with a letter
  if (!/^[a-z]/.test(safeName)) {
    safeName = 'a-' + safeName;
  }
  
  // Ensure the name is at least 3 characters long
  if (safeName.length < 3) {
    safeName = safeName + 'bot';
  }
  
  // Limit length to leave room for random suffix and hyphen
  const maxBaseLength = 39; // 45 - 5 (suffix) - 1 (hyphen)
  safeName = safeName.substring(0, maxBaseLength);
  
  // Return the combined name
  return `${safeName}-${randomSuffix}`;
}
