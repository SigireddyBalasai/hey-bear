// API-related interfaces and types

// Twilio API interfaces
export interface AreaCodeRequest {
  country: string;
}

export interface AreaCodeInfo {
  areaCode: string;
  region: string;
}

export interface ChatAPIResponse {
  response: string;
  cost?: number;
  tokens?: number;
}

export interface SearchPhoneNumberRequest {
  areaCode?: string;
  contains?: string;
  country?: string;
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
}

export interface PurchasePhoneNumberRequest {
  phoneNumber: string;
  assistantId: string;
}

export interface UpdateSettingsRequest {
  assistantId: string;
  settings: Record<string, any>;
}

export interface TestConnectionRequest {
  accountSid: string;
  authToken: string;
}

// Concierge API interfaces
export interface DeleteFileRequest {
  fileId: string;
  assistantId: string;
}

export interface FirecrawlTaskResponse {
  success: boolean;
  id: string;
  url: string;
}

export interface FirecrawlCrawlResponse {
  success: boolean;
  id: string;
  url: string;
  data?: any;
}

export interface RequestBody {
  business_name: string;
  business_phone: string;
  concierge_name: string;
  description: string;
  display_name: string;
  pinecone_name: string;
  share_phone_number: boolean;
  system_prompt: string;
  plan_id: string;
  customer_email: string;
}

export interface ErrorData {
  error: string;
  details?: string;
}

export interface FirecrawlResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface PineconeResponse {
  matches: Array<{
    id: string;
    score: number;
    metadata: Record<string, any>;
  }>;
}

export interface CreateAssistantRequest {
  name: string;
  description: string;
  systemPrompt: string;
  businessName: string;
  businessPhone: string;
  sharePhoneNumber: boolean;
  planId: string;
  customerEmail: string;
}

// Payment API interfaces
export interface CreateAssistantResult {
  success: boolean;
  assistantId?: string;
  error?: string;
}

export interface WebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      metadata: Record<string, any>;
    };
  };
}

export interface AssistantConfigData {
  name: string;
  description: string;
  systemPrompt: string;
  businessName: string;
  businessPhone: string;
  sharePhoneNumber: boolean;
}

// Stripe interfaces
export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

export interface CustomerSessionResponse {
  client_secret: string;
}

// Shared API interfaces (moved from shared-interfaces.ts)
export interface DeleteAssistantRequest {
  assistantName: string;
}

export interface ChatRequest {
  assistantId: string;
  message: string;
}

export interface ListFilesRequest {
  assistantId: string;
  pinecone_name: string;
}

export interface DirectSMSRequest {
  to: string;
  message: string;
  assistantId: string;
}

export interface InteractionRequest {
  assistantId: string;
  chat: string;
  request: string;
  response: string;
  tokenUsage: number;
  costEstimate: number;
  duration: number;
  isError: boolean;
}

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

export interface ImportPhoneNumberRequest {
  phoneNumber: string;
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
