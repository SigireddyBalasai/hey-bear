// Centralized type exports for easier imports
// This file re-exports all interfaces from organized type files

// Authentication types
export type {
  AuthContext,
  AuthResult,
  UseAdminAuthResult,
  AdminHeaderProps,
  UserData,
  UserState,
} from './auth.types';

// Assistant types
export type {
  AssistantRow,
  AssistantConfig,
  AssistantUsageLimits,
  AssistantData,
  AssistantListProps,
  AssistantWithRelations,
  DashboardAssistant,
  AssistantSelectorProps,
  Assistant,
  AssistantCardData,
  AssistantCardProps,
  PlanInfoHeaderProps,
  NormalizedAssistantData,
} from './assistant.types';

// API types
export type {
  AreaCodeRequest,
  AreaCodeInfo,
  ChatAPIResponse,
  SearchPhoneNumberRequest,
  SendMessageRequest,
  RemovePhoneNumberRequest,
  ReleasePhoneNumberRequest,
  PurchasePhoneNumberRequest,
  UpdateSettingsRequest,
  TestConnectionRequest,
  DeleteFileRequest,
  FirecrawlTaskResponse,
  FirecrawlCrawlResponse,
  RequestBody,
  ErrorData,
  FirecrawlResult,
  PineconeResponse,
  CreateAssistantRequest,
  CreateAssistantResult,
  WebhookPayload,
  AssistantConfigData,
  StripeCustomerResult,
  CustomerSessionResponse,
  DeleteAssistantRequest,
  ChatRequest,
  ListFilesRequest,
  DirectSMSRequest,
  InteractionRequest,
  PaymentSessionData,
  InteractionWebhookPayload,
  ImportPhoneNumberRequest,
  AssistantSessionData,
} from './api.types';

// Admin types
export type {
  UserUsageStats,
  UserUsageTableProps,
  RawInteractionData,
  StatsType,
  FilterOptions,
  ChartDataset,
  ChartData,
  ChartOptions,
  TimeSeriesDataPoint,
  DashboardStats,
  FetchParams,
  CacheEntry,
  InteractionCache,
  Interaction,
  AssistantData as AdminAssistantData,
  SessionData,
  UserDetailModalProps,
  SidebarLinkProps,
  UserStat,
  TableSizeData,
  TableRowCountData,
  IndexStatData,
  TimeSeriesResponse,
} from './admin.types';

// Interaction types
export type {
  PlanLimits,
  FilterComponentProps,
  FilterValues,
  TransformedInteraction,
  InteractionLogProps,
  UsageChartItem,
  DashboardData,
  ErrorHandlerOptions,
} from './interaction.types';

// UI component types
export type {
  BadgeProps,
  ButtonProps,
  FileStatusBadgeProps,
  FileErrorDialogProps,
  DateRangePickerProps,
  StripePricingTableProps,
  HeaderProps,
  CreateAssistantDialogProps,
} from './ui.types';

// Dashboard types
export type {
  TransformedInteraction as DashboardTransformedInteraction,
  StatCardProps,
  UsageDisplayProps,
  UsageProgressProps,
  ErrorFallbackProps,
  SuspenseWrapperProps,
} from './dashboard.types';

// Database types (re-export from db.types.ts)
export type { Database } from './db.types';

// Usage types (re-export from usage.types.ts)
export * from './usage.types';
