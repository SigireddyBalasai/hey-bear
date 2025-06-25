import { Database } from "@/lib/db.types";

export type AssistantRow = Database["public"]["Tables"]["assistants"]["Row"];
export type AssistantConfigRow =
  Database["public"]["Tables"]["assistant_configs"]["Row"];
export type AssistantActivityInsert =
  Database["public"]["Tables"]["assistant_activity"]["Insert"];
export type AssistantUsageLimitsInsert =
  Database["public"]["Tables"]["assistant_usage_limits"]["Insert"];

export type AssistantConfig =
  Database["public"]["Tables"]["assistant_configs"]["Row"];
export type AssistantUsageLimits =
  Database["public"]["Tables"]["assistant_usage_limits"]["Row"];
export type AssistantActivity =
  Database["public"]["Tables"]["assistant_activity"]["Row"];
export type AssistantSubscription =
  Database["public"]["Tables"]["assistant_subscriptions"]["Row"];

export type Interaction = Database["public"]["Tables"]["interactions"]["Row"];
