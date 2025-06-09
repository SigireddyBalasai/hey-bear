/**
 * Usage-related types and utilities for the Hey Bear platform
 */

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

export interface Assistant {
  id: string;
  name: string;
  plan: {
    messages: UsageData;
    tokens: UsageData;
  };
}

export interface PlanUsageProps {
  planType?: string;
  phoneNumbers?: UsageMetric;
  smsReceived?: UsageMetric;
  smsSent?: UsageMetric;
  loading?: boolean;
  selectedAssistant?: string;
  assistantSelectionDisabled?: boolean;
}

/**
 * Creates a usage metric object with calculated percentage
 */
export const createUsageMetric = (used: number, total: number): UsageMetric => {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  return {
    used,
    total,
    percentage,
  };
};

/**
 * Default usage metric with zero values
 */
export const defaultUsageMetric: UsageMetric = {
  used: 0,
  total: 1,
  percentage: 0,
};
