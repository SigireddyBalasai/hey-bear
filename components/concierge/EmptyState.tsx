import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Plus, XCircle } from 'lucide-react';

type EmptyStateProps = {
  searchQuery: string;
  onClearSearch: () => void;
  onCreateNew: () => void;
};

export function EmptyState({ searchQuery, onClearSearch, onCreateNew }: EmptyStateProps) {
  const hasSearchQuery = Boolean(searchQuery);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No No-show found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {hasSearchQuery
          ? `No No-show match your search for "${searchQuery}"`
          : "You don't have any No-show yet. Create your first one to get started."}
      </p>
      {hasSearchQuery ? (
        <Button variant="outline" onClick={onClearSearch}>
          <XCircle className="mr-2 h-4 w-4" />
          Clear search
        </Button>
      ) : (
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create No-show
        </Button>
      )}
    </div>
  );
}