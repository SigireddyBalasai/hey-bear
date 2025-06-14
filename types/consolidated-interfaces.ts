import type { VariantProps } from 'class-variance-authority';

// Consolidated interfaces from outside /types directory
// These interfaces were previously defined in various files across the codebase.
// If a duplicate exists in /types, consider removing the duplicate and updating imports.

export interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  formatter?: (value: string | number) => string;
  className?: string;
}

export interface TimeSeriesResponse {
  timeSeriesData: Array<{
    date: string;
    count: number;
    tokens: number;
    cost: number;
  }>;
}

export interface UserStat {
  userId: string;
  interactions: number;
  tokens: number;
  costs: number;
  lastActive: string | null;
  email?: string;
  fullName?: string;
  inputTokens: number;
  outputTokens: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  activeUsers: number;
  errors: number;
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

export interface DeleteFileRequest {
  assistantId: string;
  pinecone_name?: string;
  fileId: string;
}

export interface CreateAssistantResult {
  message: string;
  assistantId: string;
  pendingAssistantId: string;
}

export interface WebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any; // Stripe.Checkout.Session, but Stripe is not imported here
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  };
  type: string;
}

export interface AssistantConfigData {
  display_name?: string;
  business_name?: string;
  description?: string;
  concierge_name?: string;
  business_phone?: string;
}

export interface PurchasePhoneNumberRequest {
  phoneNumber: string;
}

export interface TestConnectionRequest {
  accountSid: string;
  authToken: string;
}

export interface ReleasePhoneNumberRequest {
  twilioSid?: string;
  phoneNumber?: string;
  adminId?: string;
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

export interface RemovePhoneNumberRequest {
  phoneNumber: string;
}

export interface UpdateSettingsRequest {
  settings: any; // TwilioSettings, but not imported here
}

export interface SendMessageRequest {
  to: string;
  message: string;
  assistantId: string;
}

export interface AreaCodeRequest {
  country?: string;
}

export interface AreaCodeInfo {
  areaCode: string;
  region: string;
  country: string;
  phoneNumber: string;
  capabilities: {
    voice?: boolean;
    SMS?: boolean;
    MMS?: boolean;
    fax?: boolean;
  };
}

export interface SearchPhoneNumberRequest {
  areaCode: string;
  country?: string;
  smsEnabled?: boolean;
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

export interface RequestBody {
  assistantId: string;
  pinecone_name: string;
  url: string;
}

export interface ErrorData {
  detail?: string;
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
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  componentName?: string;
}

export interface StripePricingTableProps {
  sessionId: string;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
  className?: string;
}

export interface CustomerSessionResponse {
  customer_session_client_secret: string;
}

export interface UsageProgressProps {
  title: string;
  metric?: any; // UsageMetric, but not imported here
  isLoading?: boolean;
  dangerThreshold?: number;
}

export interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number | string;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof import('class-variance-authority').cva> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  asChild?: boolean;
}

export interface FileErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details?: string;
}

export interface UserUsageStats {
  id?: string;
  user_id?: string;
  users?: {
    full_name?: string | null;
    email?: string | null;
    created_at?: string | null;
    last_active?: string | null;
  };
  date?: string | null;
  message_count?: number;
  token_usage?: number;
  cost_estimate?: number;
  total_messages?: number;
  assistant_count?: number;
}

export interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserUsageStats | null;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof import('class-variance-authority').cva> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export interface HeaderProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
}

export interface CreateAssistantDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: {
    name: string;
    description: string;
    conciergeName: string;
    personality: string;
    businessName: string;
    sharePhoneNumber: boolean;
    phoneNumber: string;
    selectedPlan?: string;
  };
  handleInputChange: (field: string, value: any) => void;
  handleCreateAssistant: () => Promise<void>;
  isCreating: boolean;
  userId?: string;
  // Add other fields as needed
}

export interface DateRangePickerProps {
  dateRange: any; // DateRange from react-day-picker
  onDateRangeChange: (dateRange: any) => void;
  className?: string;
}

export interface FileStatusBadgeProps {
  status: 'ready' | 'processing' | 'failed';
  className?: string;
  percentDone?: number;
}

export interface UsageDisplayProps {
  title: string;
  usage?: any; // UsageMetric | UsageData
  variant?: 'inline' | 'card';
  isLoading?: boolean;
  dangerThreshold?: number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export interface AssistantSelectorProps {
  assistants: any[]; // Should be Assistant[] if imported
  selectedAssistant: string;
  onAssistantChange: (value: string) => void;
  isLoading: boolean;
}
