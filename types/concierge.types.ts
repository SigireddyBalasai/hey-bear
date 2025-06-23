import type { Database } from '@/types/db.types';

// Database types - Re-export for convenience
export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type AssistantConfig = Database['public']['Tables']['assistant_configs']['Row'];
export type AssistantSubscription = Database['public']['Tables']['assistant_subscriptions']['Row'];
export type AssistantUsageLimits = Database['public']['Tables']['assistant_usage_limits']['Row'];
export type AssistantActivity = Database['public']['Tables']['assistant_activity']['Row'];

export interface AssistantWithNonNullableFields {
  assistant: Pick<
    AssistantRow,
    'id' | 'name' | 'created_at' | 'is_starred' | 'assigned_phone_number' | 'pending'
  >;
  config: Pick<AssistantConfig, 'description' | 'business_phone'>;
  subscription?: AssistantSubscription;
  usageLimits?: AssistantUsageLimits;
  activity?: AssistantActivity;
}

// Concierge form data - union of database types only
export type ConciergeFormData = Pick<AssistantRow, 'name'> &
  Pick<
    AssistantConfig,
    | 'description'
    | 'personality'
    | 'business_name'
    | 'share_phone_number'
    | 'business_phone'
    | 'concierge_name'
  >;

// View mode for assistant list
export type ViewMode = 'grid' | 'list';

// Props for Concierge Assistant Grid
export interface ConciergeAssistantGridProps {
  assistants: AssistantWithNonNullableFields[];
  searchQuery: string;
  selectedTab: string;
  viewMode: ViewMode;
  onDeleteAssistant: (assistantId: string) => void;
}

// Props for Concierge Assistant List Wrapper
export interface ConciergeAssistantListWrapperProps {
  assistants: AssistantWithNonNullableFields[];
  searchQuery: string;
  selectedTab: string;
  onDeleteAssistant: (assistantId: string) => void;
}

// Props for Concierge Empty State
export interface ConciergeEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onCreateNew: () => void;
  noAssistantsYet?: boolean;
}
