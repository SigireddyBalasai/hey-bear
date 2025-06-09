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

export interface Assistant {
  id: string;
  name: string;
  plan: AssistantPlan;
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

export const defaultUsageMetric: UsageMetric = {
  used: 0,
  total: 0,
  percentage: 0,
};

export const createUsageMetric = (current: number, limit: number): UsageMetric => {
  return {
    used: current,
    total: limit,
    percentage: limit > 0 ? Math.round((current / limit) * 100) : 0,
  };
};
