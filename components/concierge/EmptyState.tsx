import { Bot, Plus, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onCreateNew: () => void;
  noAssistantsYet?: boolean;
}

export function EmptyState({
  searchQuery,
  onClearSearch,
  onCreateNew,
  noAssistantsYet = true,
}: EmptyStateProps) {
  const hasSearchQuery = Boolean(searchQuery);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">
        {hasSearchQuery ? 'No No-show found' : 'No assistants found'}
      </h3>
      <p className="mb-6 max-w-md text-muted-foreground">
        {hasSearchQuery
          ? `No No-show match your search for "${searchQuery}"`
          : noAssistantsYet
            ? "You don't have any assistants yet. Create your first one to get started."
            : 'There are currently no assistants in your account.'}
      </p>
      {hasSearchQuery ? (
        <Button variant="outline" onClick={onClearSearch}>
          <XCircle className="mr-2 h-4 w-4" />
          Clear search
        </Button>
      ) : (
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Assistant
        </Button>
      )}
    </div>
  );
}
