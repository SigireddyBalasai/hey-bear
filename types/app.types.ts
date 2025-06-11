import type { User } from '@supabase/supabase-js';

import type { Database } from '@/types/db.types';

// This file will contain various TypeScript types and interfaces used throughout the application.
// Add new types and interfaces here as needed.

export interface AdminHeaderProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
}

export interface AssistantData {
  id: string;
  name: string;
  is_starred: boolean;
  created_at?: string;
  description?: string;
  has_phone_number?: boolean;
  subscription_plan?: string;
  total_messages?: number;
  last_used_at?: string;
}

export interface AssistantListProps {
  assistant: AssistantData;
  isLoading?: boolean;
  isActionInProgress?: boolean;
  onToggleStar?: (id: string, isStarred: boolean) => void;
  onDelete?: (id: string) => void;
}

// Full assistant data with joins
export interface AssistantWithRelations {
  assistant: AssistantRow;
  config: AssistantConfig | null;
  usageLimits: AssistantUsageLimits | null;
}

// Database types
export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type AssistantConfig = Database['public']['Tables']['assistant_configs']['Row'];
export type AssistantUsageLimits = Database['public']['Tables']['assistant_usage_limits']['Row'];

export interface UserData {
  id: string;
  auth_user_id?: string;
  email?: string;
  full_name?: string;
  is_admin?: boolean;
  last_sign_in?: string;
  created_at?: string;
  updated_at?: string;
  status: 'active' | 'inactive' | 'pending';
  subscription_plan?: string;
  last_active?: string | null;
  total_interactions?: number;
  total_tokens?: number;
  cost_estimate?: number;
}

export interface FilterComponentProps {
  onClose?: () => void;
  className?: string;
  setShowFilters?: (show: boolean) => void;
}

export interface FilterValues {
  fromDate: Date | undefined;
  toDate: Date | undefined;
  assistantId: string;
  searchTerm: string;
  dateRange: string;
}

export interface TransformedInteraction {
  id: string;
  interaction_time: string;
  type: string;
  status: string;
  assistant_name: string;
  assistant_id: string;
  phone_number: string;
  request: string;
  response: string | null;
}

export interface InteractionLogProps {
  interactions?: TransformedInteraction[];
  loading?: boolean;
  error?: string | null;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  activeTab: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (column: string) => void;
  onPageChange?: (page: number) => void;
  onTabChange?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
}

export type UsageChartItem = {
  date: string;
  count: number;
  tokens: number;
  cost: number;
};

export interface DashboardData {
  usageChart: UsageChartItem[];
  users?: {
    total: number;
    activeToday: number;
    activeThisWeek: number;
  };
  usage?: {
    totalMessages: number;
    totalCost: number;
  };
}

export interface UseAdminAuthResult {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  logError?: boolean;
  fallbackMessage?: string;
  context?: string;
  onError?: (error: Error) => void;
}

export interface DashboardAssistant {
  id: string;
  name: string;
  created_at?: string;
}
