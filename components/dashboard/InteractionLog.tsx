'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Phone,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoadingState } from '@/hooks/useLoadingState';
import type { Database } from '@/types/db.types';
import { withErrorHandling } from '@/utils/error-handling';
import { formatPhoneNumber } from '@/utils/phone-utils';
import { createClient } from '@/utils/supabase/client';

import { useData } from './DataContext';

// Database types
type InteractionRow = Database['public']['Tables']['interactions']['Row'];

interface TransformedInteraction {
  id: string;
  interaction_time: string;
  type: string;
  status: string;
  assistant_name: string;
  assistant_id: string;
  phone_number: string;
  request: string;
  response: string | null;
}

interface InteractionLogProps {
  interactions?: TransformedInteraction[];
  loading?: boolean;
  error?: string | null;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  activeTab: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (column: string) => void;
  onPageChange?: (page: number) => void;
  onTabChange?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
}

// Memoized sub-components
const SortableHeader = memo<{
  label: string;
  sortKey: string;
  currentSort: string;
  direction: 'asc' | 'desc';
  onSort: (key: string) => void;
}>(({ label, sortKey, currentSort, direction, onSort }) => {
  const isActive = currentSort === sortKey;

  return (
    <TableHead>
      <Button
        variant="ghost"
        className="h-auto p-0 font-medium text-left"
        onClick={() => onSort(sortKey)}
      >
        {label}
        {isActive &&
          (direction === 'asc' ? (
            <ArrowUpNarrowWide className="ml-1 h-3 w-3" />
          ) : (
            <ArrowDownNarrowWide className="ml-1 h-3 w-3" />
          ))}
      </Button>
    </TableHead>
  );
});

SortableHeader.displayName = 'SortableHeader';

const InteractionRow = memo<{
  interaction: TransformedInteraction;
  index: number;
}>(({ interaction, index }) => {
  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const variant = status === 'success' ? 'default' : 'destructive';
    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    );
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    return type === 'voice' ? (
      <Phone className="h-3 w-3 text-blue-600" />
    ) : (
      <MessageSquare className="h-3 w-3 text-green-600" />
    );
  }, []);

  return (
    <TableRow key={interaction.id} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
      <TableCell className="text-xs">{formatTimestamp(interaction.interaction_time)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {getTypeIcon(interaction.type)}
          <span className="text-xs capitalize">{interaction.type}</span>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(interaction.status)}</TableCell>
      <TableCell className="text-xs">{interaction.assistant_name}</TableCell>
      <TableCell className="text-xs">
        {interaction.phone_number ? formatPhoneNumber(interaction.phone_number) : 'N/A'}
      </TableCell>
      <TableCell className="max-w-xs truncate text-xs">{interaction.request}</TableCell>
      <TableCell className="max-w-xs truncate text-xs">
        {interaction.response || 'No response'}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

InteractionRow.displayName = 'InteractionRow';

const LoadingRow = memo(() => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-8" />
    </TableCell>
  </TableRow>
));

LoadingRow.displayName = 'LoadingRow';

const PaginationControls = memo<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}>(({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const getPaginationNumbers = useCallback(() => {
    const pages = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    const end = Math.min(totalPages, start + showPages - 1);

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="text-sm text-gray-600">
        Showing {startIndex} to {endIndex} of {totalItems} results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {getPaginationNumbers().map(pageNum => (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="min-w-[2rem]"
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

PaginationControls.displayName = 'PaginationControls';

// Main component
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
  // Context and state
  const { dateRange, searchTerm, assistantId } = useData();
  const { isLoading: loading, setIsLoading: setLoading } = useLoadingState(propLoading ?? true);
  const [error, setError] = useState<string | null>(propError ?? null);
  const [interactions, setInteractions] = useState<TransformedInteraction[]>(
    propInteractions ?? []
  );
  const [currentPage, setCurrentPage] = useState(propCurrentPage ?? 1);
  const pageSize = propPageSize ?? 5;
  const [totalPages, setTotalPages] = useState(propTotalPages ?? 1);
  const [totalItems, setTotalItems] = useState(propTotalItems ?? 0);
  const [sortBy, setSortBy] = useState(propSortBy ?? 'interaction_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(propSortDirection ?? 'desc');

  // Memoized data transformation
  const transformInteractionData = useCallback(
    (interactionsData: InteractionRow[]): TransformedInteraction[] => {
      return interactionsData.map(interaction => {
        let phoneNumber = '';
        let type = 'sms';

        try {
          const chatData = interaction.chat;
          if (chatData && typeof chatData === 'object') {
            // Handle Json type from database
            const chat = chatData as Record<string, unknown>;
            const from = 'from' in chat && typeof chat.from === 'string' ? chat.from : '';
            const to = 'to' in chat && typeof chat.to === 'string' ? chat.to : '';
            const chatType = 'type' in chat && typeof chat.type === 'string' ? chat.type : 'sms';

            phoneNumber = from || to || '';
            type = chatType || 'sms';
          } else if (typeof chatData === 'string' && chatData.trim()) {
            // Handle string JSON
            const parsedChat = JSON.parse(chatData) as Record<string, unknown>;
            const from =
              'from' in parsedChat && typeof parsedChat.from === 'string' ? parsedChat.from : '';
            const to = 'to' in parsedChat && typeof parsedChat.to === 'string' ? parsedChat.to : '';
            const chatType =
              'type' in parsedChat && typeof parsedChat.type === 'string' ? parsedChat.type : 'sms';

            phoneNumber = from || to || '';
            type = chatType || 'sms';
          }
        } catch (error) {
          console.warn('Failed to parse chat data:', error);
        }

        const id = interaction.id;
        const timestamp =
          interaction.interaction_time || interaction.created_at || new Date().toISOString();
        const isError = Boolean(interaction.is_error);
        const assistantId = interaction.assistant_id;
        const request = interaction.request || '';
        const response = interaction.response || null;

        let assistantName = 'Unknown Assistant';
        if (assistantId && assistantId.length >= 3) {
          const shortId = assistantId.slice(-3);
          assistantName = `Assistant ${shortId}`;
        }

        return {
          id,
          interaction_time: timestamp,
          type,
          status: isError ? 'failed' : 'success',
          assistant_name: assistantName,
          assistant_id: assistantId,
          phone_number: phoneNumber,
          request,
          response,
        };
      });
    },
    []
  );

  // Memoized data fetching
  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    setError(null);

    await withErrorHandling(
      async () => {
        const supabase = createClient();
        const offset = (currentPage - 1) * pageSize;

        let query = supabase
          .from('interactions')
          .select('*', { count: 'exact' })
          .order(sortBy, { ascending: sortDirection === 'asc' })
          .range(offset, offset + pageSize - 1);

        if (searchTerm) {
          query = query.or(`request.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`);
        }

        if (assistantId) {
          query = query.eq('assistant_id', assistantId);
        }

        const { data, error: queryError, count } = await query;

        if (queryError) {
          throw queryError;
        }

        const transformedData = transformInteractionData(data || []);
        setInteractions(transformedData);
        setTotalItems(count || 0);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      },
      {
        toastTitle: 'Failed to load interactions',
        fallbackMessage: 'Unable to fetch interaction data',
        onError: error => setError(error.message),
      }
    );

    setLoading(false);
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
    searchTerm,
    assistantId,
    setLoading,
    transformInteractionData,
  ]);

  // Effects
  useEffect(() => {
    if (!propInteractions) {
      fetchInteractions();
    }
  }, [fetchInteractions, propInteractions]);

  // Event handlers with useCallback
  const handleSortChange = useCallback(
    (column: string) => {
      if (propOnSortChange) {
        propOnSortChange(column);
      } else {
        const newDirection = sortBy === column && sortDirection === 'desc' ? 'asc' : 'desc';
        setSortBy(column);
        setSortDirection(newDirection);
      }
    },
    [propOnSortChange, sortBy, sortDirection]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (propOnPageChange) {
        propOnPageChange(page);
      } else {
        setCurrentPage(page);
      }
    },
    [propOnPageChange]
  );

  // Memoized rendered content
  const tableContent = useMemo(() => {
    if (loading) {
      return Array.from({ length: pageSize }).map((_, index) => <LoadingRow key={index} />);
    }

    if (interactions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
            {error ? (
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error: {error}
              </div>
            ) : (
              'No interactions found'
            )}
          </TableCell>
        </TableRow>
      );
    }

    return interactions.map((interaction, index) => (
      <InteractionRow key={interaction.id} interaction={interaction} index={index} />
    ));
  }, [loading, interactions, error, pageSize]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interaction Log</CardTitle>
            <CardDescription>
              Recent interactions for {dateRange}
              {searchTerm && ` • Searching: "${searchTerm}"`}
            </CardDescription>
          </div>
          <div className="text-sm text-gray-500">{totalItems} total interactions</div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="conversation">Conversation View</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      label="Time"
                      sortKey="interaction_time"
                      currentSort={sortBy}
                      direction={sortDirection}
                      onSort={handleSortChange}
                    />
                    <SortableHeader
                      label="Type"
                      sortKey="type"
                      currentSort={sortBy}
                      direction={sortDirection}
                      onSort={handleSortChange}
                    />
                    <SortableHeader
                      label="Status"
                      sortKey="status"
                      currentSort={sortBy}
                      direction={sortDirection}
                      onSort={handleSortChange}
                    />
                    <SortableHeader
                      label="Assistant"
                      sortKey="assistant_name"
                      currentSort={sortBy}
                      direction={sortDirection}
                      onSort={handleSortChange}
                    />
                    <TableHead>Phone</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{tableContent}</TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="conversation" className="mt-0">
            <div className="p-4">
              <div className="text-center text-gray-500">
                Conversation view will be implemented in a future update
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {totalPages > 1 && (
        <CardFooter className="px-0 py-0">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default memo(InteractionLogComponent);
