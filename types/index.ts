// Centralized type exports for easier imports
// This file re-exports all interfaces from organized type files

// Database types - Direct exports from db.types.ts
export type { Database, Json } from './db.types';

// Authentication types
export type {
  AuthContext,
  AuthResult,
  UseAdminAuthResult,
  AdminHeaderProps,
  UserData,
  UserState,
} from './auth.types';

// Assistant types (includes database type re-exports)
export type {
  AssistantRow,
  AssistantConfig,
  AssistantUsageLimits,
  AssistantActivity,
  AssistantSubscription,
  AssistantInsert,
  AssistantConfigInsert,
  AssistantUsageLimitsInsert,
  AssistantUpdate,
  AssistantConfigUpdate,
  AssistantUsageLimitsUpdate,
  AssistantData,
  AssistantListProps,
  AssistantWithRelations,
  DashboardAssistant,
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

// Admin types (includes database type re-exports)
export type {
  InteractionRow,
  UsageStatisticsRow,
  PaymentSessionRow,
  AuditLogRow,
  InteractionInsert,
  UsageStatisticsInsert,
  PaymentSessionInsert,
  AuditLogInsert,
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

// Interaction types (includes database type re-exports)
export type {
  InteractionRow as InteractionDBRow,
  PlanLimits,
  FilterComponentProps,
  FilterValues,
  TransformedInteraction,
  InteractionLogProps,
  UsageChartItem,
  DashboardData,
  ErrorHandlerOptions,
} from './interaction.types';

// Concierge types (includes database type re-exports)
export type { AssistantWithNonNullableFields, ConciergeFormData } from './concierge.types';

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

// Dashboard types (includes database type re-exports)
export type {
  InteractionRow as DashboardInteractionRow,
  TransformedInteraction as DashboardTransformedInteraction,
  StatCardProps,
  UsageDisplayProps,
  UsageProgressProps,
  AssistantSelectorProps as DashboardAssistantSelectorProps,
  ErrorFallbackProps,
  SuspenseWrapperProps,
} from './dashboard.types';

// Usage types (re-export from usage.types.ts)
export * from './usage.types';
