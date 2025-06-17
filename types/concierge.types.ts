import type { Database } from '@/types/db.types';

// Database types - Re-export for convenience
export type AssistantRow = Database['public']['Tables']['assistants']['Row'];
export type AssistantConfig = Database['public']['Tables']['assistant_configs']['Row'];
export type AssistantSubscription = Database['public']['Tables']['assistant_subscriptions']['Row'];
export type AssistantUsageLimits = Database['public']['Tables']['assistant_usage_limits']['Row'];
export type AssistantActivity = Database['public']['Tables']['assistant_activity']['Row'];

export interface AssistantWithNonNullableFields {
  assistant: {
    id: string;
    name: string;
    is_starred?: boolean;
    created_at: string;
    assigned_phone_number?: string | null;
    pending?: boolean;
  };
  config: {
    description?: string;
    business_phone?: string;
  };
  subscription?: AssistantSubscription;
  usageLimits?: AssistantUsageLimits;
  activity?: AssistantActivity;
  interactions_count: number;
  last_interaction_at: string | null;
}

export interface ConciergeFormData {
  name: string;
  description: string;
  conciergeName: string;
  personality: string;
  businessName: string;
  sharePhoneNumber: boolean;
  phoneNumber: string;
  selectedPlan: string;
}
