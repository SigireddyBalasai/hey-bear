// Interfaces migrated from API and component files for shared use.

export interface DeleteAssistantRequest {
  assistantName: string;
}

export interface ChatRequest {
  assistantId: string;
  message: string;
}

export interface ListFilesRequest {
  assistantId?: string;
  pinecone_name?: string;
}

export interface RequestBody {
  business_name: string;
  business_phone?: string;
  concierge_name: string;
  description?: string;
  display_name: string;
  pinecone_name?: string;
  share_phone_number?: boolean;
  system_prompt?: string;
  plan_id: string;
  customer_email?: string;
}

export interface DirectSMSRequest {
  to: string;
  message: string;
  assistantId?: string;
}

export interface InteractionRequest {
  assistantId: string;
  chat: string | null;
  request: string;
  response: string;
  tokenUsage?: number;
  costEstimate?: number;
  duration?: number;
  isError?: boolean;
}

export interface PaymentSessionData {
  sessionId: string;
  userId: string;
  stripeCustomerId: string;
  assistantName: string;
  assistantDescription?: string;
  conciergeName: string;
  personality?: string;
  businessName: string;
  businessPhone?: string;
  sharePhoneNumber?: boolean;
  displayName?: string;
  planType?: string;
  paymentStatus?: string;
  sessionStatus?: string;
  amountTotal?: number;
  currency?: string;
}

export interface InteractionWebhookPayload {
  assistant_id?: string;
  user_id?: string;
  request_data: string;
  response_data: string;
  chat_id?: string;
}

export interface ImportPhoneNumberRequest {
  phoneNumber: string;
}

export interface AssistantSessionData {
  name: string;
  description?: string;
  conciergeName: string;
  personality: string;
  businessName: string;
  sharePhoneNumber: boolean;
  phoneNumber: string;
}

export interface AssistantCardData {
  id: string;
  name: string;
  is_starred: boolean;
  created_at?: string;
  description?: string;
  has_phone_number?: boolean;
  subscription_plan?: 'personal' | 'business';
  total_messages?: number;
  last_used_at?: string;
}

export interface AssistantCardProps {
  assistant: AssistantCardData;
  isLoading?: boolean;
  isActionInProgress?: boolean;
  onToggleStar?: (id: string, isStarred: boolean) => void;
  onDelete?: (id: string) => void;
  onUpgrade?: (id: string) => void;
}

export interface PlanInfoHeaderProps {
  planType: string;
  isLoading: boolean;
  upgradePath?: string;
  onUpgrade?: () => void;
  variant?: 'default' | 'compact' | 'badge';
}

export interface UserState {
  id: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export type AssistantConfig = {
  description?: string;
  business_phone?: string | null;
} | null;

export interface NormalizedAssistantData {
  assistant: {
    id: string;
    name: string;
    is_starred?: boolean;
    created_at: string;
    assigned_phone_number?: string | null;
    pending?: boolean;
  };
  config?: AssistantConfig;
  subscription?: unknown;
  usageLimits?: unknown;
  activity?: unknown;
  interactions_count: number;
}
