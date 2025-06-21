// Centralized type exports for easier imports
// This file re-exports all interfaces from organized type files

// Database types - Direct exports from db.types.ts
export type { Database, Json } from './db.types';

// Authentication types
export type {
  AdminHeaderProps,
  AuthContext,
  AuthResult,
  UseAdminAuthResult,
  UserData,
  UserState,
} from './auth.types';

// Assistant types (includes database type re-exports)
export type {
  Assistant,
  AssistantActivity,
  AssistantCardData,
  AssistantCardProps,
  AssistantConfig,
  AssistantConfigInsert,
  AssistantConfigUpdate,
  AssistantData,
  AssistantInsert,
  AssistantListProps,
  AssistantRow,
  AssistantSubscription,
  AssistantUpdate,
  AssistantUsageLimits,
  AssistantUsageLimitsInsert,
  AssistantUsageLimitsUpdate,
  AssistantWithRelations,
  DashboardAssistant,
  NormalizedAssistantData,
  PlanInfoHeaderProps,
} from './assistant.types';

// API types
export type {
  AssistantConfigData,
  AssistantSessionData,
  ChatAPIResponse,
  ChatRequest,
  CreateAssistantRequest,
  CreateAssistantResult,
  CustomerSessionResponse,
  DeleteAssistantRequest,
  DeleteFileRequest,
  DirectSMSRequest,
  ErrorData,
  FirecrawlCrawlResponse,
  FirecrawlResult,
  FirecrawlTaskResponse,
  InteractionRequest,
  InteractionWebhookPayload,
  ListFilesRequest,
  PaymentSessionData,
  PineconeResponse,
  RequestBody,
  StripeCustomerResult,
  WebhookPayload,
} from './api.types';

// Admin types (includes database type re-exports)
export type {
  AssistantData as AdminAssistantData,
  AuditLogInsert,
  AuditLogRow,
  CacheEntry,
  ChartData,
  ChartDataset,
  ChartOptions,
  DashboardStats,
  FetchParams,
  FilterOptions,
  IndexStatData,
  Interaction,
  InteractionCache,
  InteractionInsert,
  InteractionRow,
  PaymentSessionInsert,
  PaymentSessionRow,
  RawInteractionData,
  SessionData,
  SidebarLinkProps,
  StatsType,
  TableRowCountData,
  TableSizeData,
  TimeSeriesDataPoint,
  TimeSeriesResponse,
  UsageStatisticsInsert,
  UsageStatisticsRow,
  UserDetailModalProps,
  UserStat,
  UserUsageStats,
  UserUsageTableProps,
} from './admin.types';

// Interaction types (includes database type re-exports)
export type {
  DashboardData,
  ErrorHandlerOptions,
  FilterComponentProps,
  FilterValues,
  InteractionRow as InteractionDBRow,
  InteractionLogProps,
  PlanLimits,
  UsageChartItem,
} from './interaction.types';

// Concierge types (includes database type re-exports)
export type { AssistantWithNonNullableFields, ConciergeFormData } from './concierge.types';

// UI component types
export type {
  BadgeProps,
  ButtonProps,
  CreateAssistantDialogProps,
  DateRangePickerProps,
  FileErrorDialogProps,
  FileStatusBadgeProps,
  HeaderProps,
  StripePricingTableProps,
} from './ui.types';

// Dashboard types (includes database type re-exports)
export type {
  AssistantSelectorProps as DashboardAssistantSelectorProps,
  ErrorFallbackProps,
  StatCardProps,
  SuspenseWrapperProps,
  UsageDisplayProps,
  UsageProgressProps,
} from './dashboard.types';

// Usage types (re-export from usage.types.ts)
export * from './usage.types';
