'use client';

import { CalendarIcon, FilterIcon, MessageSquareIcon, RefreshCw, SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InteractionEmptyStateProps {
  searchTerm?: string;
  hasFiltersApplied?: boolean;
  assistantName?: string;
  dateRange?: string;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  onShowFilters?: () => void;
  className?: string;
}

export function InteractionEmptyState({
  searchTerm,
  hasFiltersApplied = false,
  assistantName,
  dateRange,
  onClearSearch,
  onClearFilters,
  onShowFilters,
  className = '',
}: InteractionEmptyStateProps) {
  const hasSearch = searchTerm && searchTerm.trim().length > 0;
  const hasAssistantFilter = assistantName && assistantName !== 'all';
  const hasAnyActiveFilters = hasFiltersApplied ?? false ?? hasSearch ?? hasAssistantFilter;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MessageSquareIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">No Interactions Found</CardTitle>
        <CardDescription className="text-base">
          {hasAnyActiveFilters
            ? 'No interactions match your current search and filter criteria.'
            : 'No interactions have been recorded yet.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasAnyActiveFilters && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-3 font-medium text-sm">Current Filters</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {hasSearch && (
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4" />
                  <span>Searching for: &quot;{searchTerm}&quot;</span>
                </div>
              )}
              {hasAssistantFilter && (
                <div className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  <span>Assistant: {assistantName}</span>
                </div>
              )}
              {dateRange && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date Range: {dateRange}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Try these suggestions:</h4>
          <div className="grid gap-2 text-sm text-muted-foreground">
            {hasAnyActiveFilters ? (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>Clear your search terms or adjust date ranges</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>Try selecting &quot;All Assistants&quot; instead of a specific one</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>Expand your date range to include more historical data</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>Create an assistant and start receiving interactions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>Configure your assistant&apos;s phone number for SMS interactions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>
                    Share your assistant&apos;s contact information to begin conversations
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {hasAnyActiveFilters && (
          <div className="flex flex-col gap-2 pt-4 border-t sm:flex-row">
            {hasSearch && onClearSearch && (
              <Button variant="outline" onClick={onClearSearch} className="flex-1">
                <SearchIcon className="mr-2 h-4 w-4" />
                Clear Search
              </Button>
            )}
            {onClearFilters && (
              <Button variant="outline" onClick={onClearFilters} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset All Filters
              </Button>
            )}
            {onShowFilters && (
              <Button variant="default" onClick={onShowFilters} className="flex-1">
                <FilterIcon className="mr-2 h-4 w-4" />
                Adjust Filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
