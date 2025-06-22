// Interaction and usage-related interfaces and types
import type { Database } from '@/types/db.types';

// Database types - Re-export for convenience
export type InteractionRow = Database['public']['Tables']['interactions']['Row'];
export type InteractionInsert = Database['public']['Tables']['interactions']['Insert'];
export type InteractionUpdate = Database['public']['Tables']['interactions']['Update'];

// Plan limits interface
export interface PlanLimits {
  phoneLimit: number;
  smsLimit: number;
}

// Filter component props
export interface FilterComponentProps {
  onClose: () => void;
  className: string;
  setShowFilters: (show: boolean) => void;
}

// Filter values interface
export interface FilterValues {
  fromDate: Date | undefined;
  toDate: Date | undefined;
  assistantId: string;
  searchTerm: string;
  dateRange: string;
}

// Interaction log props
export interface InteractionLogProps {
  interactions: InteractionRow[];
  loading: boolean;
  error: string;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  activeTab: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onPageChange: (page: number) => void;
  onTabChange: (tab: string) => void;
  setActiveTab: (tab: string) => void;
  onShowFilters?: () => void; // Optional prop for showing filters
}

// Usage chart item interface
export interface UsageChartItem {
  date: string;
  count: number;
  tokens: number;
  cost: number;
}

// Dashboard data interface
export interface DashboardData {
  usageChart: UsageChartItem[];
  users: {
    total: number;
    activeToday: number;
    activeThisWeek: number;
  };
  usage: {
    totalMessages: number;
    totalCost: number;
  };
}

// Error handler options
export interface ErrorHandlerOptions {
  showToast: boolean;
  toastTitle: string;
  logError: boolean;
  fallbackMessage: string;
  context: string;
  onError: (error: Error) => void;
}
