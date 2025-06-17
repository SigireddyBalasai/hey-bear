// Assistant-related interfaces and types
import type { Database } from '@/types/db.types';

// Database types - Re-export for convenience
export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type AssistantConfig = Database['public']['Tables']['assistant_configs']['Row'];
export type AssistantUsageLimits = Database['public']['Tables']['assistant_usage_limits']['Row'];
export type AssistantActivity = Database['public']['Tables']['assistant_activity']['Row'];
export type AssistantSubscription = Database['public']['Tables']['assistant_subscriptions']['Row'];

// Database insert types
export type AssistantInsert = Database['public']['Tables']['assistants']['Insert'];
export type AssistantConfigInsert = Database['public']['Tables']['assistant_configs']['Insert'];
export type AssistantUsageLimitsInsert =
  Database['public']['Tables']['assistant_usage_limits']['Insert'];

// Database update types
export type AssistantUpdate = Database['public']['Tables']['assistants']['Update'];
export type AssistantConfigUpdate = Database['public']['Tables']['assistant_configs']['Update'];
export type AssistantUsageLimitsUpdate =
  Database['public']['Tables']['assistant_usage_limits']['Update'];

// Assistant data interface
export interface AssistantData {
  id: string;
  name: string;
  is_starred: boolean;
  created_at: string;
  description: string;
  has_phone_number: boolean;
  subscription_plan: string;
  total_messages: number;
  last_used_at: string;
}

// Assistant list props
export interface AssistantListProps {
  assistant: AssistantData;
  isLoading: boolean;
  isActionInProgress: boolean;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (id: string) => void;
}

// Full assistant data with joins
export interface AssistantWithRelations {
  assistant: AssistantRow;
  config: AssistantConfig;
  usageLimits: AssistantUsageLimits;
}

// Dashboard assistant interface
export interface DashboardAssistant {
  id: string;
  name: string;
  created_at: string;
}

// Assistant selector props
// Assistant for dashboard URL interface
export interface Assistant {
  id: string;
  name: string;
}

// Assistant card interfaces (moved from shared-interfaces.ts)
export interface AssistantCardData {
  id: string;
  name: string;
  is_starred: boolean;
  created_at: string;
  description: string;
  has_phone_number: boolean;
  subscription_plan: 'personal' | 'business';
  total_messages: number;
  last_used_at: string;
}

export interface AssistantCardProps {
  assistant: AssistantCardData;
  isLoading: boolean;
  isActionInProgress: boolean;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (id: string) => void;
  onDeleteAssistant: (assistantId: string) => void;
  onUpgrade: (id: string) => void;
}

export interface PlanInfoHeaderProps {
  planType: string;
  isLoading: boolean;
  upgradePath: string;
  onUpgrade: () => void;
  variant: 'default' | 'compact' | 'badge';
}

export interface NormalizedAssistantData {
  assistant: {
    id: string;
    name: string;
    is_starred: boolean;
    created_at: string;
    assigned_phone_number: string;
    pending: boolean;
  };
  config: {
    description: string;
    business_phone: string;
  };
  subscription: unknown;
  usageLimits: unknown;
  activity: unknown;
  interactions_count: number;
}

// Simple assistant config type
export type SimpleAssistantConfig = {
  description: string;
  business_phone: string;
};
