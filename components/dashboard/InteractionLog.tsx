'use client';

import React, { memo } from 'react';

import { useData } from './DataContext';
import { InteractionEmptyState } from './InteractionEmptyState';
import { InteractionRow } from './InteractionRow';
import { PaginationControls } from './PaginationControls';
import { SortableHeader } from './SortableHeader';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInteractionData } from '@/hooks/useInteractionData';
import type { InteractionLogProps } from '@/types/interaction.types';


// Loading component
const LoadingRow = memo(() => (
  <TableRow>
    {Array.from({ length: 8 }).map((_, index) => (
      <td key={index} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </TableRow>
));

LoadingRow.displayName = 'LoadingRow';

const InteractionLogComponent: React.FC<InteractionLogProps> = ({
  interactions: propInteractions,
  loading: propLoading,
  error: propError,
  currentPage: propCurrentPage,
  pageSize: propPageSize,
  totalPages: propTotalPages,
  totalItems: propTotalItems,
  activeTab,
  sortBy: propSortBy,
  sortDirection: propSortDirection,
  onSortChange: propOnSortChange,
  onPageChange: propOnPageChange,
  onShowFilters, // New optional prop
}) => {
  // Context data - must be called at top level
  const { searchTerm, assistantId, setSearchTerm, setAssistantId, dateRange } = useData();

  // Use custom hook for data management if props are not provided
  const hookData = useInteractionData({
    dateRange: null, // Convert string dateRange to null for now, or implement proper conversion
    searchTerm,
    assistantId,
    activeTab,
    initialPage: propCurrentPage,
    pageSize: propPageSize,
    initialSortBy: propSortBy,
    initialSortDirection: propSortDirection,
  });

  // Use props if provided, otherwise use hook data
  const interactions = propInteractions ?? hookData.interactions;
  const loading = propLoading ?? hookData.loading;
  const error = propError ?? hookData.error;
  const currentPage = propCurrentPage ?? hookData.currentPage;
  const pageSize = propPageSize ?? hookData.pageSize;
  const totalPages = propTotalPages ?? hookData.totalPages;
  const totalItems = propTotalItems ?? hookData.totalItems;
  const sortBy = propSortBy ?? hookData.sortBy;
  const sortDirection = propSortDirection ?? hookData.sortDirection;
  const onSortChange = propOnSortChange ?? hookData.onSortChange;
  const onPageChange = propOnPageChange ?? hookData.onPageChange;

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Interactions</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Empty state
  if (!loading && interactions.length === 0) {
    // Get assistant name for display
    const getAssistantDisplayName = (id: string | null) => {
      if (!id || id === 'all') return 'All Assistants';

      return `Assistant ${id.slice(-8)}`; // Show last 8 characters of ID
    };

    const hasFiltersApplied = Boolean(assistantId && assistantId !== 'all');

    const handleClearSearch = () => {
      setSearchTerm('');
    };

    const handleClearFilters = () => {
      setSearchTerm('');
      setAssistantId(null);
    };

    return (
      <InteractionEmptyState
        searchTerm={searchTerm}
        hasFiltersApplied={hasFiltersApplied}
        assistantName={getAssistantDisplayName(assistantId)}
        dateRange={dateRange}
        onClearSearch={handleClearSearch}
        onClearFilters={handleClearFilters}
        onShowFilters={onShowFilters}
        className="mx-auto max-w-2xl"
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interaction Log</CardTitle>
        <CardDescription>View and manage all interactions with your assistants</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab || 'all'} className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader
                        label="Type"
                        column="type"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Phone"
                        column="phone_number"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="User Message"
                        column="user_message"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Assistant Response"
                        column="assistant_response"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Time"
                        column="interaction_time"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Tokens"
                        column="token_usage"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        label="Cost"
                        column="cost_estimate"
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                      />
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: pageSize }, (_, index) => (
                        <LoadingRow key={`skeleton-row-${Math.random()}-${index}`} />
                      ))
                    : interactions.map(interaction => (
                        <InteractionRow key={interaction.id} interaction={interaction} />
                      ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </CardFooter>
    </Card>
  );
};

export default memo(InteractionLogComponent);
