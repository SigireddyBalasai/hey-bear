import { AssistantWithNonNullableFields } from "@/types/AssistantWithNonNullableFields";

export type ViewMode = "grid" | "list";
export interface ConciergeAssistantGridProps {
  assistants: AssistantWithNonNullableFields[];
  searchQuery: string;
  selectedTab: string;
  viewMode: ViewMode;
  onDeleteAssistant: (assistantId: string) => void;
}
