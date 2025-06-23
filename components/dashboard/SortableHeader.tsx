import React, { memo } from 'react';

import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SortableHeaderProps {
  label: string;
  column: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: string) => void;
}

export const SortableHeader = memo<SortableHeaderProps>(
  ({ label, column, sortBy, sortDirection, onSortChange }) => {
    const isSorted = sortBy === column;
    const icon = isSorted ? (
      sortDirection === 'asc' ? (
        <ArrowUpNarrowWide className="h-4 w-4" />
      ) : (
        <ArrowDownNarrowWide className="h-4 w-4" />
      )
    ) : null;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium justify-start"
        onClick={() => onSortChange(column)}
      >
        {label}
        {icon && <span className="ml-1">{icon}</span>}
      </Button>
    );
  }
);

SortableHeader.displayName = 'SortableHeader';
