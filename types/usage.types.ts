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

export interface UsageMetric {
  used: number;
  total: number;
  percentage: number;
}

export interface UsageData {
  current: number;
  limit: number;
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
