import type { Json } from '@/types/db.types';

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
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export interface UsageDisplayProps {
  currentUsage: number;
  limit: number;
  label: string;
  className?: string;
}

export interface UsageProgressProps {
  current: number;
  limit: number;
  label: string;
  className?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export interface SuspenseWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
