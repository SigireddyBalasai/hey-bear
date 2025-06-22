import type { Database } from '@/types/db.types';

export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type PaymentSessionRow = Database['public']['Tables']['payment_sessions']['Row'];
export type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];

export type CreateAssistantRequest = Pick<AssistantRow, 'name'> &
  Pick<
    AssistantConfigRow,
    'description' | 'concierge_name' | 'business_name' | 'business_phone'
  > & {
    plan?: string;
    stripeCheckoutSessionId?: string;
    paymentSessionId?: string;
  };

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
  data?: Record<string, string | number | boolean | null>;
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
    external: { url: string; text?: string; href?: string; title?: string }[];
  };
  success?: boolean;
  data?: Record<string, string | number | boolean | null>;
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
  citations?:
    | {
        source?: string;
        url?: string;
        title?: string;
      }[]
    | null;
}

export interface CreateAssistantResult {
  message: string;
  assistantId: string;
  pendingAssistantId: string;
}

export interface WebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      metadata: Record<string, string | number | boolean | null>;
      object?: string;
    };
  };
}

export type AssistantConfigData = Pick<
  AssistantConfigRow,
  'display_name' | 'business_name' | 'description' | 'concierge_name' | 'business_phone'
>;

export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

export interface CustomerSessionResponse {
  customer_session_client_secret: string;
}

export interface ErrorData {
  detail?: string;
  details?: string;
  message?: string;
}

export interface ChatRequest {
  message: string;
  assistantId: string;
  chatId?: string;
}

export type DeleteAssistantRequest = Pick<AssistantRow, 'id' | 'name'> &
  Pick<AssistantConfigRow, 'pinecone_name'> & {
    assistantId: string;
    assistantName?: string;
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

export type PaymentSessionData = PaymentSessionRow & {
  sessionId: string;
  userId: string;
  stripeCustomerId: string;
  assistantName: string;
  businessName: string;
  displayName: string;
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

export interface PurchaseRequestBody {
  phoneNumber?: string;
  areaCode?: string;
  countryCode?: string;
}

export interface AssignPhoneNumberRequest {
  assistantId: string;
  phoneNumberId: string;
  webhookUrl?: string;
}

export interface UnassignPhoneNumberRequest {
  assistantId: string;
}

export interface UserMetadata {
  full_name?: string;
  name?: string;
  stripe_customer_id?: string;
  [key: string]: unknown;
}

export interface UserUsage {
  interactions_used: number;
  assistants_used: number;
  token_usage: number;
  cost_estimate: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  max_assistants: number;
  max_interactions: number;
  created_at: string;
  updated_at: string;
}

export interface ExtendedUser {
  id: string;
  auth_user_id: string;
  email: string | undefined;
  full_name: string | undefined;
  last_sign_in: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  stripe_customer_id: string | null;
  plan: Plan;
  userusage: UserUsage;
}

export interface AssignRequestBody {
  phoneNumberId: string;
  assistantId: string;
  webhookUrl?: string;
}

export interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  capabilities: Record<string, unknown>;
  isoCountry?: string;
  voiceUrl?: string;
  smsUrl?: string;
  smsFallbackUrl?: string;
}
