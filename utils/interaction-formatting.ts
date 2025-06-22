import type { Database } from '@/types/db.types';

type InteractionRow = Database['public']['Tables']['interactions']['Row'];

/**
 * Extracts phone number from interaction data
 */
export function extractPhoneNumber(interaction: InteractionRow): string {
  try {
    if (interaction.chat && typeof interaction.chat === 'string') {
      const chatData = JSON.parse(interaction.chat);
      const data = chatData as { from?: string; to?: string };

      return data.from ?? data.to ?? '';
    }
  } catch (error) {
    console.warn('Failed to extract phone number:', error);
  }

  return '';
}

/**
 * Extracts message type from interaction data
 */
export function extractMessageType(interaction: InteractionRow): string {
  try {
    if (interaction.chat && typeof interaction.chat === 'string') {
      const chatData = JSON.parse(interaction.chat);
      const data = chatData as { type?: string };

      return data.type ?? 'sms';
    }
  } catch (error) {
    console.warn('Failed to extract message type:', error);
  }

  return 'sms';
}

/**
 * Extracts user message from interaction data
 */
export function extractUserMessage(interaction: InteractionRow): string {
  try {
    if (interaction.chat && typeof interaction.chat === 'string') {
      const chatData = JSON.parse(interaction.chat);
      const data = chatData as { user_message?: string; Body?: string };

      return data.user_message ?? data.Body ?? '';
    }
  } catch (error) {
    console.warn('Failed to extract user message:', error);
  }

  return '';
}

/**
 * Extracts assistant response from interaction data
 */
export function extractAssistantResponse(interaction: InteractionRow): string {
  try {
    if (interaction.chat && typeof interaction.chat === 'string') {
      const chatData = JSON.parse(interaction.chat);
      const data = chatData as { assistant_response?: string };

      return data.assistant_response ?? '';
    }
  } catch (error) {
    console.warn('Failed to extract assistant response:', error);
  }

  return '';
}

/**
 * Formats a message for display, handling long messages and null values
 */
export function formatMessage(message: string | null, maxLength = 100): string {
  if (!message) return 'No message';

  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength)}...`;
}

/**
 * Formats cost estimate for display
 */
export function formatCostEstimate(cost: number | null): string {
  if (cost === null || cost === undefined) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(cost);
}

/**
 * Formats duration for display
 */
export function formatDuration(duration: number | null): string {
  if (!duration) return '0s';
  if (duration < 60) return `${duration}s`;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return `${minutes}m ${seconds}s`;
}

/**
 * Gets the appropriate icon component for interaction type
 */
export function getInteractionTypeIcon(type: string) {
  return type === 'voice' ? 'Phone' : 'MessageSquare';
}

/**
 * Gets the appropriate badge variant for interaction type
 */
export function getInteractionTypeBadgeVariant(
  type: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  return type === 'voice' ? 'default' : 'secondary';
}

/**
 * Formats the relative time for display
 */
export function formatRelativeTime(date: string | null): string {
  if (!date) return 'Unknown';

  const now = new Date();
  const interactionTime = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - interactionTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return interactionTime.toLocaleDateString();
}
