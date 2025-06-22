import type { Database } from '@/types/db.types';

// Use database types only
export type Assistant = Pick<Database['public']['Tables']['assistants']['Row'], 'id' | 'name'> & {
  activity?: Pick<
    Database['public']['Tables']['assistant_activity']['Row'],
    'total_messages' | 'total_tokens'
  >;
  limits?: Pick<
    Database['public']['Tables']['assistant_usage_limits']['Row'],
    'message_limit' | 'token_limit'
  >;
};

export interface UsageAnalytics {
  overview: UsageOverview;
  user_stats: UserUsageStats[];
  daily_stats: {
    date: string;
    interactions: number;
    tokens: number;
    cost: number;
    unique_users: number;
  }[];
  top_users: UserUsageStats[];
}

export interface UsageData {
  current: number;
  limit: number;
  percentage: number;
}

export interface UsageMetric {
  used: number;
  total: number;
  percentage: number;
}

export interface AssistantPlan {
  messages: UsageData;
  tokens: UsageData;
}

export interface PlanUsageProps {
  planType: string;
  phoneNumbers: UsageMetric;
  smsReceived: UsageMetric;
  smsSent: UsageMetric;
  loading: boolean;
  selectedAssistant: string;
  assistantSelectionDisabled: boolean;
}

export interface UserUsageData {
  id: string;
  user_id: string;
  total_interactions: number;
  total_tokens: number;
  total_cost: number;
  users?: {
    id: string;
    email?: string;
  };
}

export interface UserUsageStats {
  user_id: string;
  interactions_count: number;
  token_usage: number;
  cost_estimate: number;
  assistants_count: number;
  first_interaction: string | null;
  last_interaction: string | null;
}

export interface UsageOverview {
  total_users: number;
  total_interactions: number;
  total_tokens: number;
  total_cost: number;
  total_assistants: number;
  active_users_24h: number;
  active_users_7d: number;
  avg_interactions_per_user: number;
  avg_tokens_per_interaction: number;
}

export const defaultUsageMetric: UsageMetric = {
  used: 0,
  total: 0,
  percentage: 0,
};

export const createUsageMetric = (current: number, limit: number): UsageMetric => ({
  used: current,
  total: limit,
  percentage: limit > 0 ? Math.round((current / limit) * 100) : 0,
});
