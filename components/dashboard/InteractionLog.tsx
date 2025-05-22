"use client";
import React, { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Phone,
  AlertTriangle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from './DataContext';

export interface InteractionLogProps {
  interactions?: any[];
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
  onTabChange: propOnTabChange,
  setActiveTab
}: InteractionLogProps) => {
  // Context and state
  const { dateRange, searchTerm, assistantId } = useData();
  const [loading, setLoading] = useState(propLoading ?? true);
  const [error, setError] = useState<string | null>(propError || null);
  const [interactions, setInteractions] = useState<any[]>(propInteractions || []);
  const [currentPage, setCurrentPage] = useState(propCurrentPage ?? 1);
  const [pageSize, setPageSize] = useState(propPageSize ?? 5);
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
        // In a real implementation, this would be an API call
        // For now, simulate loading with setTimeout and mock data
        setTimeout(() => {
          // Generate mock data
          const mockInteractions = Array.from({ length: 10 }).map((_, i) => ({
            id: `int-${i}`,
            interaction_time: new Date(Date.now() - i * 86400000).toISOString(),
            type: i % 3 === 0 ? 'call' : 'sms',
            status: i % 5 === 0 ? 'failed' : i % 4 === 0 ? 'pending' : 'success',
            assistant_name: `Assistant ${i % 3 + 1}`,
            assistant_id: `ast-${i % 3 + 1}`,
            phone_number: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            request: `This is a sample message ${i + 1}`,
            response: i % 4 === 0 ? null : `This is a sample response to message ${i + 1}`
          }));
          
          setInteractions(mockInteractions);
          setTotalItems(25); // Mock total
          setTotalPages(Math.ceil(25 / pageSize));
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching interactions:', err);
        setError('Failed to load interactions. Please try again.');
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [dateRange, searchTerm, assistantId, activeTab, sortBy, sortDirection, currentPage, pageSize, propInteractions]);

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
      hour12: true
    });
  };

  const getIconForType = (interaction: any) => {
    switch (interaction.type) {
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusIndicator = (interaction: any) => {
    switch (interaction.status) {
      case 'success':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">Success</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs">Failed</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">Unknown</span>;
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

  const handleTabChange = (tab: string) => {
    if (propOnTabChange) {
      propOnTabChange(tab);
    } else if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? 
        <ArrowUpNarrowWide className="inline h-4 w-4 ml-1" /> : 
        <ArrowDownNarrowWide className="inline h-4 w-4 ml-1" />;
    }
    return null;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-2">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-red-500 font-semibold">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
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
                onClick={() => handleSortChange('interaction_time')}
              >
                Timestamp {getSortIcon('interaction_time')}
              </TableHead>
              <TableHead>
                Type
              </TableHead>
              <TableHead>
                Status
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSortChange('assistant_id')}
              >
                Assistant {getSortIcon('assistant_id')}
              </TableHead>
              <TableHead>
                Contact
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={`loading-row-${index}`}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : interactions.length > 0 ? (
              interactions.map((interaction, index) => (
                <TableRow key={interaction.id || index}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {formatTimestamp(interaction.interaction_time)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getIconForType(interaction)}
                      {interaction.type?.toUpperCase() || 'SMS'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusIndicator(interaction)}</TableCell>
                  <TableCell>{interaction.assistant_name || 'N/A'}</TableCell>
                  <TableCell>{interaction.phone_number || 'Unknown'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/interactions/${interaction.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
            <div key={`loading-conversation-${index}`} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : interactions.length > 0 ? (
          interactions.map((interaction, index) => (
            <div key={interaction.id || index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  {getIconForType(interaction)}
                  <span className="font-medium">{interaction.assistant_name || 'Unknown Assistant'}</span>
                  <span className="text-gray-400">({interaction.phone_number || 'Unknown'})</span>
                </div>
                <div className="text-sm text-gray-500">{formatTimestamp(interaction.interaction_time)}</div>
              </div>
              <div className="text-gray-700">
                {interaction.request || 'No message content available'}
              </div>
              {interaction.response && (
                <div className="bg-blue-50 p-3 rounded text-gray-700">
                  <div className="text-sm font-medium mb-1">Response:</div>
                  {interaction.response}
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <div>{getStatusIndicator(interaction)}</div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/interactions/${interaction.id}`} target="_blank" rel="noopener noreferrer">
                    View Details <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No conversations found
          </div>
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
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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