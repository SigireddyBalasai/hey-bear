// Admin-related interfaces and types
import type { Database } from '@/types/db.types';

// User usage statistics interface
export interface UserUsageStats {
  id: string;
  user_id: string;
  users: {
    full_name: string;
    email: string;
    created_at: string;
    last_active: string;
  };
  date: string;
  message_count: number;
  token_usage: number;
  cost_estimate: number;
}

// User usage table props
export interface UserUsageTableProps {
  usageData: UserUsageStats[];
}

// Raw interaction data interface
export interface RawInteractionData {
  id: string;
  request: string;
  response: string;
  assistant_id: string;
  chat: string;
  cost_estimate: number;
  created_at: string;
  duration: number;
  input_tokens: number;
  interaction_time: string;
  is_error: boolean;
  monthly_period: string;
  output_tokens: number;
  token_usage: number;
  updated_at: string;
  user_id: string;
}

// Stats type interface
export interface StatsType {
  totalInteractions: number;
  activeContacts: number;
  interactionsPerContact: number;
  averageResponseTime: string;
}

// Filter options interface
export interface FilterOptions {
  fromDate: string;
  toDate: string;
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
        label: (context: unknown) => string;
      };
    };
  };
}

// Time series data point interface
export interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costs: number;
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

// Assistant data interface
export interface AssistantData {
  name: string;
  description: string;
  concierge_name: string;
  personality: string;
  business_name: string;
  business_phone: string;
  share_phone_number: boolean;
  display_name: string;
}

// Session data interface
export interface SessionData {
  assistantData: AssistantData;
  customerId: string;
  userId: string;
  authUserId: string;
  createdAt: string;
  expiresAt: string;
}

// User detail modal interfaces
export interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

// Admin sidebar interfaces
export interface SidebarLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
}

// Admin usage page interfaces
export interface UserStat {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  total_assistants: number;
  total_messages: number;
  total_cost: number;
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
  data: TimeSeriesDataPoint[];
}
