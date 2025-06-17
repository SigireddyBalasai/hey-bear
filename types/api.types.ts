// API-related interfaces and types

// Twilio API interfaces
export interface AreaCodeRequest {
  country?: string;
}

export interface AreaCodeInfo {
  areaCode: string;
  region: string;
  country: string;
}

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

export interface SearchPhoneNumberRequest {
  areaCode: string;
  country?: string;
  smsEnabled?: boolean;
}

export interface SendMessageRequest {
  to: string;
  message: string;
  assistantId: string;
}

export interface RemovePhoneNumberRequest {
  phoneNumber: string;
  assistantId: string;
}

export interface ReleasePhoneNumberRequest {
  phoneNumber: string;
  assistantId: string;
  twilioSid?: string;
  adminId?: string;
}

export interface PurchasePhoneNumberRequest {
  phoneNumber: string;
}

export interface UpdateSettingsRequest {
  assistantId: string;
  settings: Record<string, unknown>;
}

export interface TestConnectionRequest {
  accountSid: string;
  authToken: string;
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
}

export interface FirecrawlCrawlResponse {
  task_id: string;
  success?: boolean;
  id?: string;
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

export interface CreateAssistantRequest {
  assistantName: string;
  description?: string;
  params?: {
    conciergeName?: string;
    businessName?: string;
    phoneNumber?: string;
  };
  stripeCheckoutSessionId?: string;
  paymentSessionId?: string;
  plan?: string;
}

// Payment API interfaces
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
      metadata: Record<string, unknown>;
      object?: string;
    };
  };
}

export interface AssistantConfigData {
  display_name?: string;
  business_name?: string;
  description?: string;
  concierge_name?: string;
  business_phone?: string;
}

// Stripe interfaces
export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

export interface CustomerSessionResponse {
  customer_session_client_secret: string;
}

// File operations interfaces
export interface RequestBody {
  assistantId: string;
  pinecone_name: string;
  url: string;
}

export interface ErrorData {
  detail?: string;
  details?: string;
  message?: string;
}

export interface FirecrawlTaskResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  result?: FirecrawlResult;
  results?: FirecrawlResult[];
}

export interface FirecrawlCrawlResponse {
  task_id: string;
}

export interface FirecrawlResult {
  url: string;
  html?: string;
  cleaned_html?: string;
  markdown?: string;
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
  };
  links?: {
    external: Array<{ url: string; text?: string; href?: string; title?: string }>;
  };
}

// Missing API interfaces
export interface ChatRequest {
  message: string;
  assistantId: string;
  chatId?: string;
}

export interface DeleteAssistantRequest {
  assistantId: string;
  assistantName?: string;
  pinecone_name?: string;
  namespace?: string;
  index_name?: string;
}

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

export interface ImportPhoneNumberRequest {
  phoneNumber: string;
  assistantId: string;
}

// Additional missing interfaces
export interface PaymentSessionData {
  sessionId: string;
  userId: string;
  stripeCustomerId: string;
  assistantName: string;
  assistantDescription: string;
  conciergeName: string;
  personality: string;
  businessName: string;
  businessPhone: string;
  sharePhoneNumber: boolean;
  displayName: string;
  planType: string;
  paymentStatus: string;
  sessionStatus: string;
  amountTotal: number;
  currency: string;
}

export interface InteractionWebhookPayload {
  assistant_id: string;
  user_id: string;
  request_data: string;
  response_data: string;
  chat_id: string;
}

export interface AssistantSessionData {
  name: string;
  description: string;
  conciergeName: string;
  personality: string;
  businessName: string;
  sharePhoneNumber: boolean;
  phoneNumber: string;
}
