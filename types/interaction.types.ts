// Interaction and usage-related interfaces and types

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
  fromDate: Date;
  toDate: Date;
  assistantId: string;
  searchTerm: string;
  dateRange: string;
}

// Transformed interaction interface
export interface TransformedInteraction {
  id: string;
  interaction_time: string;
  type: string;
  status: string;
  assistant_name: string;
  assistant_id: string;
  phone_number: string;
  request: string;
  response: string;
}

// Interaction log props
export interface InteractionLogProps {
  interactions: TransformedInteraction[];
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
}

// Usage chart item interface
export type UsageChartItem = {
  date: string;
  count: number;
  tokens: number;
  cost: number;
};

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
