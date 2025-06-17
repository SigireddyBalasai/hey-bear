'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InteractionLogProps } from '@/types/interaction.types';
import { useData } from './DataContext';
import { useInteractionData } from '@/hooks/useInteractionData';
import { PaginationControls } from './PaginationControls';
import { SortableHeader } from './SortableHeader';
import { InteractionRow } from './InteractionRow';

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
}) => {
  // Context data
  const { dateRange, searchTerm, assistantId } = useData();

  // Use custom hook for data management if props are not provided
  const hookData = useInteractionData({
    dateRange,
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
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Interactions Found</CardTitle>
          <CardDescription>
            No interactions match your current filters. Try adjusting your search criteria.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interaction Log</CardTitle>
        <CardDescription>
          View and manage all interactions with your assistants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab || "all"} className="space-y-4">
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
                  {loading ? (
                    Array.from({ length: pageSize }).map((_, index) => (
                      <LoadingRow key={index} />
                    ))
                  ) : (
                    interactions.map((interaction) => (
                      <InteractionRow
                        key={interaction.id}
                        interaction={interaction}
                      />
                    ))
                  )}
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
