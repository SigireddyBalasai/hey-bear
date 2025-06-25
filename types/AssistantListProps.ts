import { AssistantCardData } from "./AssistantCardProps";

export interface AssistantListProps {
  assistant: AssistantCardData;
  isLoading: boolean;
  isActionInProgress: boolean;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (id: string) => void;
}
