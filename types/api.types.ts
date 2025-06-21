// API-related interfaces and types
import type { Database } from '@/types/db.types';

// Database types for API usage
export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type PaymentSessionRow = Database['public']['Tables']['payment_sessions']['Row'];
export type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];

// Create assistant request - using db.types only
export type CreateAssistantRequest = Pick<AssistantRow, 'name'> &
  Pick<
    AssistantConfigRow,
    'description' | 'concierge_name' | 'business_name' | 'business_phone'
  > & {
    plan?: string;
    stripeCheckoutSessionId?: string;
    paymentSessionId?: string;
  };

// Twilio API interfaces

export interface ChatAPIResponse {
  response?: string;
  tokens?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
  cost?: number;
  timing?: {
    responseDuration?: number;
  };
}

// Concierge API interfaces
export interface DeleteFileRequest {
  fileId: string;
  assistantId: string;
  pinecone_name?: string;
}

export interface FirecrawlTaskResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  result?: FirecrawlResult;
  results?: FirecrawlResult[];
  success?: boolean;
  id?: string;
  url?: string;
  current?: number;
  total?: number;
  data?: FirecrawlResult[];
  error?: string;
}

export interface FirecrawlCrawlResponse {
  task_id: string;
  success?: boolean;
  id: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface RequestBody {
  assistantId: string;
  pinecone_name: string;
  url: string;
  business_name?: string;
  business_phone?: string;
  concierge_name?: string;
  description?: string;
  display_name?: string;
  share_phone_number?: boolean;
  system_prompt?: string;
  plan_id?: string;
  customer_email?: string;
}

export interface ErrorData {
  error?: string;
  detail?: string;
  details?: string;
  message?: string;
}

export interface FirecrawlResult {
  url: string;
  html?: string;
  cleaned_html?: string;
  markdown?: string;
  content?: string;
  markdown_v2?: {
    raw_markdown: string;
    markdown_with_citations: string;
    references_markdown: string;
  };
  status_code?: number;
  error_message?: string;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    sourceURL?: string;
  };
  links?: {
    external: Array<{ url: string; text?: string; href?: string; title?: string }>;
  };
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface PineconeResponse {
  message?: {
    content?: string;
  };
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  citations?: unknown;
}

// Payment API interfaces
export type CreateAssistantResult = {
  message: string;
  assistantId: string;
  pendingAssistantId: string;
};

export interface WebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      metadata: Record<string, unknown>;
      object?: string;
    };
  };
}

// Assistant config data type - based on database type
export type AssistantConfigData = Pick<
  AssistantConfigRow,
  'display_name' | 'business_name' | 'description' | 'concierge_name' | 'business_phone'
>;

// Stripe interfaces
export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

export interface CustomerSessionResponse {
  customer_session_client_secret: string;
}

// File operations interface - removed duplicate RequestBody

export interface ErrorData {
  detail?: string;
  details?: string;
  message?: string;
}

// Missing API interfaces
export interface ChatRequest {
  message: string;
  assistantId: string;
  chatId?: string;
}

export type DeleteAssistantRequest = Pick<AssistantRow, 'id' | 'name'> &
  Pick<AssistantConfigRow, 'pinecone_name'> & {
    // API-specific fields for backward compatibility
    assistantId: string; // maps to id
    assistantName?: string; // maps to name
    namespace?: string;
    index_name?: string;
  };

export interface ListFilesRequest {
  assistantId: string;
  pinecone_name?: string;
}

export interface DirectSMSRequest {
  to: string;
  message: string;
  assistantId: string;
}

export interface InteractionRequest {
  assistantId: string;
  requestData: string;
  responseData: string;
  chatId?: string;
  chat?: string;
  request?: string;
  response?: string;
  tokenUsage?: number;
  costEstimate?: number;
  duration?: number;
  isError?: boolean;
}

// Additional missing interfaces
// Payment session data type - database type with additional API fields
export type PaymentSessionData = PaymentSessionRow & {
  // Additional fields expected by API code
  sessionId: string; // maps to session_id
  userId: string; // maps to user_id
  stripeCustomerId: string; // maps to stripe_customer_id
  assistantName: string; // from assistant_config_data JSON
  businessName: string; // from assistant_config_data JSON
  displayName: string; // from assistant_config_data JSON
  assistantDescription: string; // from assistant_config_data JSON
  conciergeName: string; // from assistant_config_data JSON
  businessPhone: string; // from assistant_config_data JSON
  personality: string; // from assistant_config_data JSON
  sharePhoneNumber: boolean; // from assistant_config_data JSON
};

export interface InteractionWebhookPayload {
  assistant_id: string;
  user_id: string;
  request_data: string;
  response_data: string;
  chat_id: string;
}

// Assistant session data - using unions of db.types only
export type AssistantSessionData = Pick<AssistantRow, 'name'> &
  Pick<
    AssistantConfigRow,
    | 'description'
    | 'personality'
    | 'business_name'
    | 'share_phone_number'
    | 'business_phone'
    | 'concierge_name'
  >;
