// Admin-related interfaces and types
import type { Database } from '@/types/db.types';

// Database types - Re-export for convenience
export type InteractionRow = Database['public']['Tables']['interactions']['Row'];
export type UsageStatisticsRow = Database['public']['Tables']['usage_statistics']['Row'];
export type PaymentSessionRow = Database['public']['Tables']['payment_sessions']['Row'];
export type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];

// Assistant data types - Union of database types with flexible nullability
export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];
export type AssistantData = Pick<AssistantRow, 'name'> & {
  description?: string | null | undefined;
  concierge_name?: string | null | undefined;
  personality?: string | null | undefined;
  business_name?: string | null | undefined;
  business_phone?: string | null | undefined;
  share_phone_number?: boolean | null | undefined;
  display_name?: string | null | undefined;
};

// Database insert types
export type InteractionInsert = Database['public']['Tables']['interactions']['Insert'];
export type UsageStatisticsInsert = Database['public']['Tables']['usage_statistics']['Insert'];
export type PaymentSessionInsert = Database['public']['Tables']['payment_sessions']['Insert'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

// User usage statistics interface - joined data from multiple tables (usage_statistics + auth.users)
export interface UserUsageStats {
  id: string; // from usage_statistics
  user_id: string; // from usage_statistics
  users: {
    full_name: string; // from auth.users metadata
    email: string; // from auth.users
    created_at: string; // from auth.users
    last_active: string; // computed/derived
  };
  date: string; // from usage_statistics period
  message_count: number; // from usage_statistics messages_count
  token_usage: number; // from usage_statistics token_usage
  cost_estimate: number; // from usage_statistics cost_estimate
}

// User usage table props
export interface UserUsageTableProps {
  usageData: UserUsageStats[];
}

// Raw interaction data interface - Use database type instead
export type RawInteractionData = InteractionRow;

// Stats type interface
export interface StatsType {
  totalInteractions: number;
  activeContacts: number;
  interactionsPerContact: number;
  averageResponseTime: string;
}

// Filter options interface
export interface FilterOptions {
  fromDate?: string;
  toDate?: string;
  assistantId: string;
  searchTerm: string;
}

// Chart interfaces
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  fill: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales: {
    y: {
      beginAtZero: boolean;
      ticks: {
        callback: (value: string | number) => string;
      };
    };
  };
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip: {
      callbacks: {
        label: (context: {
          label?: string;
          parsed?: { y: number };
          dataset?: { label?: string };
        }) => string;
      };
    };
  };
}

// Time series data point interface
export interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costs: number;
  activeUsers: number;
  errors: number;
}

// Dashboard stats interface
export interface DashboardStats {
  users: {
    total: number;
    activeToday: number;
    activeThisWeek: number;
  };
  interactions: {
    total: number;
    totalTokens: number;
    costEstimate: number;
    errorRate: number;
  };
  timeSeriesData: TimeSeriesDataPoint[];
  userUsage: UserUsageStats[];
}

// Fetch params interface
export interface FetchParams {
  page: number;
  pageSize: number;
  searchTerm: string;
  assistantId: string;
}

// Cache entry interface
export interface CacheEntry {
  data: Interaction[];
  timestamp: number;
}

// Interaction cache type
export type InteractionCache = Map<string, CacheEntry>;

// Interaction type from database
export type Interaction = Database['public']['Tables']['interactions']['Row'];

// Session data interface
export interface SessionData {
  assistantData: AssistantData;
  customerId: string;
  userId: string;
  authUserId: string;
  createdAt: string;
  expiresAt: string;
}

// Admin sidebar interfaces
export interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number | string;
}

// Admin usage page interfaces - Database-oriented UserStat
export interface UserStat {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  total_assistants: number;
  total_messages: number;
  total_cost: number;
}

// Analytics UserStat interface - for analytics data
export interface AnalyticsUserStat {
  userId: string;
  interactions: number;
  tokens: number;
  costs: number;
  lastActive: string | null;
  email?: string;
  fullName?: string;
  inputTokens: number;
  outputTokens: number;
  percentage?: number;
}

// Admin database page interfaces
export interface TableSizeData {
  table_name: string;
  size_bytes: number;
  size_pretty: string;
}

export interface TableRowCountData {
  table_name: string;
  row_count: number;
}

export interface IndexStatData {
  indexname: string;
  tablename: string;
  size_bytes: number;
  size_pretty: string;
}

// Admin dashboard interfaces
export interface TimeSeriesResponse {
  timeSeriesData: {
    date: string;
    count: number;
    tokens: number;
    cost: number;
  }[];
}

export interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserUsageStats | null;
  userId?: string;
  userEmail?: string;
}
