import { AssistantRow } from "./basics";
import { AssistantConfig } from "./basics";
import { AssistantSubscription } from "./basics";
import { AssistantUsageLimits } from "./basics";
import { AssistantActivity } from "./basics";

export interface AssistantWithNonNullableFields {
  assistant: Pick<
    AssistantRow,
    | "id"
    | "name"
    | "created_at"
    | "is_starred"
    | "assigned_phone_number"
    | "pending"
  >;
  config: Pick<AssistantConfig, "description" | "business_phone">;
  subscription?: AssistantSubscription;
  usageLimits?: AssistantUsageLimits;
  activity?: AssistantActivity;
}
