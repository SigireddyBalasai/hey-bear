import {
  AssistantRow,
  AssistantConfig,
  AssistantSubscription,
  AssistantActivity,
} from "./basics";
export type AssistantCardData = Pick<
  AssistantRow,
  "id" | "name" | "is_starred" | "created_at" | "assigned_phone_number"
> &
  Pick<AssistantConfig, "description"> &
  Pick<AssistantActivity, "total_messages" | "last_used_at"> &
  Pick<AssistantSubscription, "plan_name">;

export interface AssistantCardProps {
  assistant: AssistantCardData;
  isLoading: boolean;
  isActionInProgress: boolean;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (id: string) => void;
  onDeleteAssistant: (assistantId: string) => void;
  onUpgrade: (id: string) => void;
}
