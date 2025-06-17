import type { Database, Json } from '@/types/db.types';

import type { Assistant, UsageData, UsageMetric } from './usage.types';

export interface AssistantSelectorProps {
  assistants: Assistant[];
  selectedAssistant: string;
  onAssistantChange: (value: string) => void;
  isLoading: boolean;
}

// Database types - Re-export for convenience
export type InteractionRow = Database['public']['Tables']['interactions']['Row'];

export interface TransformedInteraction {
  id: string;
  date: string; // Formatted date
  phoneNumber: string; // Derived from assistant_id or other source in API
  message: string; // Request content
  response: string; // Response content
  type: string; // e.g., 'Inbound, Outbound', 'Inbound', 'Outbound'
  responseTime: string; // Formatted duration
  assistant_id: string;
  user_id: string;
  duration: number; // Raw duration in ms
  interaction_time: string; // Raw interaction time string
  chat: Json; // chat log if available
  assistant_name: string; // Name of the assistant
  status: string; // Interaction status (e.g., 'Completed', 'Pending', 'Failed') - needs a source or default
}

// Dashboard component interfaces

export interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  formatter?: (value: string | number) => string;
  className?: string;
}

export interface UsageProgressProps {
  title: string;
  metric?: UsageMetric; // UsageMetric from usage.types.ts
  isLoading?: boolean;
  dangerThreshold?: number;
}

export interface UsageDisplayProps {
  title: string;
  usage?: UsageMetric | UsageData; // UsageMetric | UsageData from usage.types.ts
  variant?: 'inline' | 'card';
  isLoading?: boolean;
  dangerThreshold?: number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  componentName?: string;
}
