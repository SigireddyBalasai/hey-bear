import { AssistantWithNonNullableFields } from "@/types/AssistantWithNonNullableFields";

export interface ConciergeAssistantListWrapperProps {
  assistants: AssistantWithNonNullableFields[];
  searchQuery: string;
  selectedTab: string;
  onDeleteAssistant: (assistantId: string) => void;
}
