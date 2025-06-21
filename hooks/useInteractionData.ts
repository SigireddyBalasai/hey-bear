import { useCallback, useEffect, useState } from 'react';

import type { Database } from '@/types/db.types';
import type { InteractionRow } from '@/types/interaction.types';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

type DatabaseInteractionRow = Database['public']['Tables']['interactions']['Row'];

interface UseInteractionDataProps {
  dateRange?: { from: Date; to: Date } | null;
  searchTerm?: string;
  assistantId?: string | null;
  activeTab?: string;
  initialPage?: number;
  pageSize?: number;
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function useInteractionData({
  dateRange,
  searchTerm,
  assistantId,
  activeTab,
  initialPage = 1,
  pageSize = 5,
  initialSortBy = 'interaction_time',
  initialSortDirection = 'desc',
}: UseInteractionDataProps) {
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  const supabase = createClient();

  const fetchInteractions = useCallback(async () => {
    await withErrorHandling(
      async () => {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase.from('interactions').select('*', { count: 'exact' });

        // Apply filters
        if (dateRange?.from && dateRange?.to) {
          query = query
            .gte('interaction_time', dateRange.from.toISOString())
            .lte('interaction_time', dateRange.to.toISOString());
        }

        if (searchTerm && searchTerm.trim()) {
          query = query.or(
            `user_message.ilike.%${searchTerm}%,assistant_response.ilike.%${searchTerm}%`
          );
        }

        if (assistantId && assistantId !== 'all') {
          query = query.eq('assistant_id', assistantId);
        }

        // Apply tab filters
        if (activeTab === 'errors') {
          query = query.not('error_details', 'is', null);
        } else if (activeTab === 'sms') {
          query = query.contains('chat', { type: 'sms' });
        } else if (activeTab === 'voice') {
          query = query.contains('chat', { type: 'voice' });
        }

        // Apply sorting
        query = query.order(sortBy as keyof InteractionRow, { ascending: sortDirection === 'asc' });

        // Apply pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error: queryError, count } = await query;

        if (queryError) {
          throw queryError;
        }

        setInteractions(data || []);
        setTotalItems(count || 0);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      },
      {
        fallbackMessage: 'Failed to fetch interactions',
        onError: () => {
          setInteractions([]);
          setTotalItems(0);
          setTotalPages(1);
        },
      }
    );

    setLoading(false);
  }, [
    supabase,
    dateRange,
    searchTerm,
    assistantId,
    activeTab,
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
  ]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const handleSortChange = useCallback(
    (column: string) => {
      setSortBy(column);
      setSortDirection(prev => (column === sortBy ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'));
      setCurrentPage(1); // Reset to first page when sorting changes
    },
    [sortBy]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    interactions,
    loading,
    error,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    sortBy,
    sortDirection,
    onSortChange: handleSortChange,
    onPageChange: handlePageChange,
    refetch: fetchInteractions,
  };
}
