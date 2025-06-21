/**
 * Utility functions for generating dashboard URLs with assistant-specific parameters
 */
import type { Database } from '@/types/db.types';

type Assistant = Pick<Database['public']['Tables']['assistants']['Row'], 'id' | 'name'>;

/**
 * Generate a dashboard URL with optional assistant parameter
 * @param assistantNameOrId - Assistant name or ID to include in URL
 * @returns Dashboard URL with concierge parameter
 */
export function getDashboardUrl(assistantNameOrId?: string): string {
  const baseDashboardUrl = '/dashboard';

  if (!assistantNameOrId) {
    return baseDashboardUrl;
  }

  return `${baseDashboardUrl}?concierge=${encodeURIComponent(assistantNameOrId)}`;
}

/**
 * Generate an assistant-specific dashboard URL using assistant object
 * @param assistant - Assistant object with id and name
 * @returns Dashboard URL with concierge parameter using assistant name (preferred) or id
 */
export function getAssistantDashboardUrl(assistant: Assistant): string {
  // Prefer using the assistant name for cleaner URLs, fallback to ID
  const identifier = assistant.name || assistant.id;

  return getDashboardUrl(identifier);
}

/**
 * Extract assistant identifier from dashboard URL
 * @param url - Dashboard URL to parse
 * @returns Assistant identifier or null if not found
 */
export function getAssistantFromDashboardUrl(url: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);

    return urlObj.searchParams.get('concierge');
  } catch {
    return null;
  }
}

/**
 * Check if a URL is an assistant-specific dashboard URL
 * @param url - URL to check
 * @returns True if URL contains concierge parameter
 */
export function isAssistantDashboardUrl(url: string): boolean {
  return getAssistantFromDashboardUrl(url) !== null;
}
