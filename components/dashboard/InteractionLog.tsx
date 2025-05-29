'use client';

import { useEffect, useState } from 'react';

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

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';

import { useData } from './DataContext';

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

export interface InteractionLogProps {
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

const InteractionLog = ({
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
  onTabChange: _propOnTabChange, // Mark as unused
  setActiveTab: _setActiveTab, // Mark as unused
}: InteractionLogProps) => {
  // Context and state
  const { dateRange, searchTerm, assistantId } = useData();
  const [loading, setLoading] = useState(propLoading ?? true);
  const [error, setError] = useState<string | null>(propError ?? null);
  const [interactions, setInteractions] = useState<TransformedInteraction[]>(
    propInteractions ?? []
  );
  const [currentPage, setCurrentPage] = useState(propCurrentPage ?? 1);
  const pageSize = propPageSize ?? 5; // Remove unused setter
  const [totalPages, setTotalPages] = useState(propTotalPages ?? 1);
  const [totalItems, setTotalItems] = useState(propTotalItems ?? 0);
  const [sortBy, setSortBy] = useState(propSortBy ?? 'interaction_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(propSortDirection ?? 'desc');

  // If props aren't provided, fetch interactions data
  useEffect(() => {
    if (propInteractions) return;

    const fetchInteractions = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // Fetch real interactions from database
        const {
          data: interactionsData,
          error,
          count,
        } = await supabase
          .schema('analytics')
          .from('interactions')
          .select('id, created_at, assistant_id, request, response, chat, is_error')
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (error) {
          console.error('Error fetching interactions:', error);
          throw new Error('Failed to fetch interactions from database');
        }

        // Transform database data to component format
        const transformedInteractions = interactionsData.map(interaction => {
          // Parse chat data to get phone number and type
          let phoneNumber = '';
          let type = 'sms';

          try {
            if (interaction.chat) {
              const chatData = JSON.parse(interaction.chat);
              phoneNumber = chatData.from ?? chatData.to ?? '';
              type = chatData.type ?? 'sms';
            }
          } catch (error_) {
            // If chat parsing fails, use defaults
            console.warn('Failed to parse chat data:', error_);
          }

          return {
            id: interaction.id,
            interaction_time: interaction.created_at ?? new Date().toISOString(),
            type: type,
            status: interaction.is_error ? 'failed' : 'success',
            assistant_name: `Assistant ${(interaction.assistant_id ?? '').slice(-3) || 'Unknown'}`,
            assistant_id: interaction.assistant_id ?? '',
            phone_number: phoneNumber,
            request: interaction.request,
            response: interaction.response,
          };
        });

        setInteractions(transformedInteractions);
        setTotalItems(count ?? 0);
        setTotalPages(Math.ceil((count ?? 0) / pageSize));
        setLoading(false);
      } catch (error_) {
        console.error('Error fetching interactions:', error_);
        setError('Failed to load interactions. Please try again.');
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [
    dateRange,
    searchTerm,
    assistantId,
    activeTab,
    sortBy,
    sortDirection,
    currentPage,
    pageSize,
    propInteractions,
  ]);

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getIconForType = (interaction: TransformedInteraction) => {
    switch (interaction.type) {
      case 'sms': {
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      }
      case 'call': {
        return <Phone className="h-4 w-4 text-green-500" />;
      }
      default: {
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      }
    }
  };

  const getStatusIndicator = (interaction: TransformedInteraction) => {
    switch (interaction.status) {
      case 'success': {
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
            Success
          </span>
        );
      }
      case 'failed': {
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">Failed</span>
        );
      }
      case 'pending': {
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
            Pending
          </span>
        );
      }
      default: {
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">Unknown</span>
        );
      }
    }
  };

  const handleSortChange = (column: string) => {
    if (propOnSortChange) {
      propOnSortChange(column);
    } else {
      setSortBy(column);
      setSortDirection(sortBy === column && sortDirection === 'desc' ? 'asc' : 'desc');
    }
  };

  const handlePageChange = (page: number) => {
    if (propOnPageChange) {
      propOnPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? (
        <ArrowUpNarrowWide className="ml-1 inline h-4 w-4" />
      ) : (
        <ArrowDownNarrowWide className="ml-1 inline h-4 w-4" />
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 p-8">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="font-semibold text-red-500">{error}</p>
        <Button onClick={() => { globalThis.location.reload(); }}>Try Again</Button>
      </div>
    );
  }

  const renderTableView = () => {
    return (
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => { handleSortChange('interaction_time'); }}
              >
                Timestamp {getSortIcon('interaction_time')}
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => { handleSortChange('assistant_id'); }}
              >
                Assistant {getSortIcon('assistant_id')}
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`loading-row-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                </TableRow>
              ))
            ) : interactions.length > 0 ? (
              interactions.map((interaction, index) => (
                <TableRow key={interaction.id || index}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatTimestamp(interaction.interaction_time)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getIconForType(interaction)}
                      {interaction.type.toUpperCase() || 'SMS'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusIndicator(interaction)}</TableCell>
                  <TableCell>{interaction.assistant_name || 'N/A'}</TableCell>
                  <TableCell>{interaction.phone_number || 'Unknown'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`/interactions/${interaction.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                  No interactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { handlePageChange(Math.max(1, currentPage - 1)); }}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { handlePageChange(Math.min(totalPages, currentPage + 1)); }}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderConversationView = () => {
    return (
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`loading-conversation-${index}`} className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : interactions.length > 0 ? (
          interactions.map((interaction, index) => (
            <div key={interaction.id || index} className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  {getIconForType(interaction)}
                  <span className="font-medium">
                    {interaction.assistant_name || 'Unknown Assistant'}
                  </span>
                  <span className="text-gray-400">({interaction.phone_number || 'Unknown'})</span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTimestamp(interaction.interaction_time)}
                </div>
              </div>
              <div className="text-gray-700">
                {interaction.request || 'No message content available'}
              </div>
              {interaction.response && (
                <div className="rounded bg-blue-50 p-3 text-gray-700">
                  <div className="mb-1 text-sm font-medium">Response:</div>
                  {interaction.response}
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div>{getStatusIndicator(interaction)}</div>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`/interactions/${interaction.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Details <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">No conversations found</div>
        )}

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { handlePageChange(Math.max(1, currentPage - 1)); }}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { handlePageChange(Math.min(totalPages, currentPage + 1)); }}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {activeTab === 'table' ? renderTableView() : renderConversationView()}
    </div>
  );
};

export default InteractionLog;
