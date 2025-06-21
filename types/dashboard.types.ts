import type { Assistant, UsageData, UsageMetric } from './usage.types';

export interface AssistantSelectorProps {
  assistants: Assistant[];
  selectedAssistant: string;
  onAssistantChange: (value: string) => void;
  isLoading: boolean;
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
