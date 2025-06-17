import type { Database } from '@/types/db.types';
import type { TransformedInteraction } from '@/types/interaction.types';

type InteractionRow = Database['public']['Tables']['interactions']['Row'];

/**
 * Transforms raw interaction data from the database into a format suitable for display
 */
export function transformInteractionData(interactionsData: InteractionRow[]): TransformedInteraction[] {
  return interactionsData.map(interaction => {
    let phoneNumber = '';
    let type = 'sms';

    try {
      const chatData = interaction.chat;
      if (chatData && typeof chatData === 'object') {
        // Handle Json type from database
        const chat = chatData as Record<string, unknown>;
        const from = 'from' in chat && typeof chat.from === 'string' ? chat.from : '';
        const to = 'to' in chat && typeof chat.to === 'string' ? chat.to : '';
        const chatType = 'type' in chat && typeof chat.type === 'string' ? chat.type : 'sms';

        phoneNumber = from || to || '';
        type = chatType || 'sms';
      } else if (typeof chatData === 'string' && chatData.trim()) {
        // Handle string JSON
        const parsedChat = JSON.parse(chatData) as Record<string, unknown>;
        const from =
          'from' in parsedChat && typeof parsedChat.from === 'string' ? parsedChat.from : '';
        const to = 'to' in parsedChat && typeof parsedChat.to === 'string' ? parsedChat.to : '';
        const chatType =
          'type' in parsedChat && typeof parsedChat.type === 'string' ? parsedChat.type : 'sms';

        phoneNumber = from || to || '';
        type = chatType || 'sms';
      }
    } catch (error) {
      console.warn('Failed to parse chat data:', error);
    }

    return {
      id: interaction.id,
      assistant_id: interaction.assistant_id,
      user_id: interaction.user_id,
      user_message: interaction.user_message,
      assistant_response: interaction.assistant_response,
      interaction_time: interaction.interaction_time,
      phone_number: phoneNumber,
      type: type as 'sms' | 'voice',
      token_usage: interaction.token_usage,
      cost_estimate: interaction.cost_estimate,
      error_details: interaction.error_details,
      created_at: interaction.created_at,
      updated_at: interaction.updated_at,
    };
  });
}

/**
 * Formats a message for display, handling long messages and null values
 */
export function formatMessage(message: string | null, maxLength: number = 100): string {
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
 * Gets the appropriate icon component for interaction type
 */
export function getInteractionTypeIcon(type: string) {
  return type === 'voice' ? 'Phone' : 'MessageSquare';
}

/**
 * Gets the appropriate badge variant for interaction type
 */
export function getInteractionTypeBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
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
