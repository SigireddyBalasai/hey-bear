// utils/mock-data.ts
import { Tables } from "@/lib/db.types";
import { NormalizedAssistantData } from "./assistant-data";

/**
 * Generate mock assistant data without requiring API calls
 * This replaces the need for data fetching throughout the application
 */

// Mock file type for the assistant files list
export interface MockFile {
  id: string;
  name: string;
  created_at: string;
  purpose?: string;
  status?: 'ready' | 'processing' | 'deleting' | 'error';
}

// Mock files list type
export interface MockFilesList {
  files: MockFile[];
}

/**
 * Get a mock assistant
 */
export function getMockAssistant(assistantId: string): NormalizedAssistantData {
  return {
    assistant: {
      id: assistantId,
      name: "Sample No-Show Assistant",
      assigned_phone_number: "+15555555555",
      created_at: new Date().toISOString(),
      is_starred: false,
      pending: false,
      user_id: "user-1"
    },
    config: {
        id: assistantId,
        // address property removed as it's not in AssistantConfig interface
        business_name: null,
        business_phone: null,
        concierge_name: "Sample No-Show",
        concierge_personality: "Business Casual",
      created_at: new Date().toISOString(),
      description: "This is a sample No-Show assistant for demonstration",
      email: null,
      pinecone_name: "sample-pinecone-index",
      share_phone_number: false,
      system_prompt: "You are a helpful No-Show assistant designed to provide information based on the documents provided.",
      updated_at: new Date().toISOString(),
      website: null
    },
    subscription: {
      id: `subscription-${assistantId}`,
      assistant_id: assistantId,
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_start: new Date().toISOString(),
      plan_id: "plan_personal",
      status: "active",
      stripe_subscription_id: `sub_${Math.random().toString(36).substring(2, 10)}`,
      updated_at: new Date().toISOString()
    },
    usageLimits: {
      assistant_id: assistantId,
      created_at: new Date().toISOString(),
      document_limit: 100,
      message_limit: 1000,
      token_limit: 100000,
      updated_at: new Date().toISOString(),
      webpage_limit: 50
    },
    activity: null,
    interactions_count: 10,
    last_interaction_at: new Date().toISOString()
  };
}

/**
 * Get a list of mock assistants for a user
 */
export function getMockAssistants(userId: string, count: number = 3): NormalizedAssistantData[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `assistant-${index + 1}`;
    const assistant = getMockAssistant(id);
    
    // Customize each assistant
    assistant.assistant.name = `Sample Assistant ${index + 1}`;
    assistant.assistant.is_starred = index === 0; // Star the first one
    (assistant.config as any).description = `This is sample assistant number ${index + 1}`;
    
    // Vary interaction counts
    assistant.interactions_count = Math.floor(Math.random() * 50);
    
    return assistant;
  });
}

/**
 * Get mock files for an assistant
 */
export function getMockFiles(assistantId: string): MockFilesList {
  return {
    files: [
      {
        id: `file-1-${assistantId}`,
        name: 'Sample Document.pdf',
        status: 'ready',
        purpose: 'document',
        created_at: new Date().toISOString()
      },
      {
        id: `file-2-${assistantId}`,
        name: 'Getting Started Guide.docx',
        status: 'ready',
        purpose: 'document',
        created_at: new Date().toISOString()
      }
    ]
  };
}

/**
 * Mock chat message type
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Get mock chat history
 */
export function getMockChatHistory(): ChatMessage[] {
  return [
    {
      role: 'system',
      content: 'You are a helpful No-Show assistant designed to provide information based on the documents provided.',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      role: 'user',
      content: 'Hello, can you help me understand the documents I\'ve uploaded?',
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      role: 'assistant',
      content: 'Hello! I\'d be happy to help you understand your documents. I see you\'ve uploaded a few files. What specific information are you looking for?',
      timestamp: new Date(Date.now() - 2900000).toISOString()
    },
    {
      role: 'user',
      content: 'Can you summarize the key points from the PDF?',
      timestamp: new Date(Date.now() - 2000000).toISOString()
    },
    {
      role: 'assistant',
      content: 'Based on the PDF you uploaded, here are the key points:\n\n1. The document covers best practices for customer service\n2. It emphasizes active listening and empathy\n3. There are sections on handling difficult conversations\n4. It includes templates for common customer interactions\n\nWould you like me to elaborate on any specific section?',
      timestamp: new Date(Date.now() - 1900000).toISOString()
    }
  ];
}