import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';

type EmptyStateProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCreateDialogOpen: (open: boolean) => void;
};

export function EmptyState({ searchQuery, setSearchQuery, setCreateDialogOpen }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No concierge found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {searchQuery ?
          `No concierge match your search for "${searchQuery}"` :
          "You don't have any concierge yet. Create your first one to get started."}
      </p>
      {searchQuery ? (
        <Button variant="outline" onClick={() => setSearchQuery('')}>
          Clear search
        </Button>
      ) : (
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create concierge
        </Button>
      )}
    </div>
  );
}