export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface FileWithStatus {
  id: string;
  name: string;
  created_at: string;
  status?: string;
  purpose?: string;
}

export type AssistantFileStatus = 'ready' | 'processing' | 'failed';

export interface FileErrorState {
  title: string;
  description: string;
  details?: string;
  show: boolean;
}

export interface User {
  user_metadata?: {
    avatar_url?: string;
  };
}
