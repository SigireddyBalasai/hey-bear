import type { Database } from '@/types/db.types';

// Centralized interfaces/types migrated from components and app files

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
}

export interface UserUsageTableProps {
  usageData: UserUsageStats[];
}

export interface RawInteractionData {
  id: string;
  request: string;
  response: string;
  assistant_id: string | null;
  chat: string | null;
  cost_estimate: number | null;
  created_at: string | null;
  duration: number | null;
  input_tokens: number | null;
  interaction_time: string | null;
  is_error: boolean | null;
  monthly_period: string | null;
  output_tokens: number | null;
  token_usage: number | null;
  updated_at: string | null;
  user_id: string | null;
}

export interface StatsType {
  totalInteractions: number;
  activeContacts: number;
  interactionsPerContact: number;
  averageResponseTime: string;
}

export interface FilterOptions {
  fromDate?: string;
  toDate?: string;
  assistantId?: string | null;
  searchTerm?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension?: number;
  fill?: boolean;
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
      ticks?: {
        callback?: (value: string | number) => string;
      };
    };
  };
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      callbacks?: {
        label?: (context: unknown) => string;
      };
    };
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costs: number;
  errors: number;
}

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

export interface FetchParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  assistantId?: string | null | undefined;
}

export interface CacheEntry {
  data: Interaction[];
  timestamp: number;
}

export type InteractionCache = Map<string, CacheEntry>;

export type Interaction = Database['public']['Tables']['interactions']['Row'];

export interface AssistantData {
  name: string;
  description?: string;
  concierge_name?: string;
  personality?: string;
  business_name?: string;
  business_phone?: string;
  share_phone_number?: boolean;
  display_name?: string;
}

export interface SessionData {
  assistantData: AssistantData;
  customerId: string;
  userId: string;
  authUserId: string;
  createdAt: string;
  expiresAt: string;
}
