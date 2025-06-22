// Assistant-related interfaces and types
import type { Database } from '@/types/db.types';

// Assistant card data - union of database types only
export type AssistantCardData = Pick<
  AssistantRow,
  'id' | 'name' | 'is_starred' | 'created_at' | 'assigned_phone_number'
> &
  Pick<AssistantConfig, 'description'> &
  Pick<AssistantActivity, 'total_messages' | 'last_used_at'> &
  Pick<AssistantSubscription, 'plan_name'>;
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

// Use database types directly instead of custom interfaces
export type AssistantData = AssistantRow;
export type DashboardAssistant = Pick<AssistantRow, 'id' | 'name' | 'created_at'>;
export type Assistant = Pick<AssistantRow, 'id' | 'name'>;

// Assistant list props - using AssistantCardData which is based on db.types
export interface AssistantListProps {
  assistant: AssistantCardData;
  isLoading: boolean;
  isActionInProgress: boolean;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (id: string) => void;
}

// Full assistant data with joins - using db.types for all components
export interface AssistantWithRelations {
  assistant: AssistantRow;
  config: AssistantConfig;
  usageLimits: AssistantUsageLimits;
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

// Normalized assistant data using database types only
export interface NormalizedAssistantData {
  assistant: Pick<
    AssistantRow,
    'id' | 'name' | 'is_starred' | 'created_at' | 'assigned_phone_number' | 'pending'
  >;
  config: Pick<AssistantConfig, 'description' | 'business_phone'>;
  subscription: AssistantSubscription | null;
  usageLimits: AssistantUsageLimits | null;
  activity: AssistantActivity | null;
}

// Simple assistant config type
export type SimpleAssistantConfig = Pick<AssistantConfig, 'description' | 'business_phone'>;

export interface Assistant {
  id: string;
  name: string;
  assignedPhoneNumber?: string;
}
