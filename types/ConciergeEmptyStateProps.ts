export interface ConciergeEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onCreateNew: () => void;
  noAssistantsYet?: boolean;
}
