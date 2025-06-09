/**
 * Utilities for processing chat data
 */
import type { Json } from '@/lib/db.types';

/**
 * Parse and analyze chat data to determine direction
 * @param item The chat item to analyze
 * @param direction The direction to check for (incoming or outgoing)
 * @returns Whether the chat matches the specified direction
 */
export const isChatDirection = (
  item: { chat?: Json | null },
  direction: 'incoming' | 'outgoing'
): boolean => {
  if (!item || !item.chat) return false;

  try {
    let chatData: Record<string, unknown>;

    // Handle both string and Json types
    if (typeof item.chat === 'string') {
      chatData = JSON.parse(item.chat) as Record<string, unknown>;
    } else if (typeof item.chat === 'object') {
      chatData = item.chat as Record<string, unknown>;
    } else {
      return false;
    }

    // Safely check properties with type guards
    if (chatData && typeof chatData === 'object') {
      // First check explicit direction property
      if ('direction' in chatData && typeof chatData.direction === 'string') {
        return chatData.direction === direction;
      }

      // Fallback to checking from/to properties
      return direction === 'incoming' ? 'from' in chatData : 'to' in chatData;
    }

    return false;
  } catch (_parseError) {
    return false;
  }
};

/**
 * Process an array of chat data to count messages by direction
 * @param data Array of chat items to analyze
 * @param direction The direction to count (incoming or outgoing)
 * @returns Number of messages matching the specified direction
 */
export const countChatsByDirection = (
  data: { chat?: Json | null }[],
  direction: 'incoming' | 'outgoing'
): number => {
  if (!data || !Array.isArray(data)) return 0;
  return data.filter(item => isChatDirection(item, direction)).length;
};
