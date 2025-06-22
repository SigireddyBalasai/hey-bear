'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { useLoadingState } from '@/hooks/useLoadingState';
import type {
  CacheEntry,
  FetchParams,
  FilterOptions,
  Interaction,
  InteractionCache,
  InteractionRow,
  StatsType,
} from '@/types/admin.types';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

// Data transformation utilities
const transformInteractionRow = (row: InteractionRow): Interaction => row; // InteractionRow and Interaction should be the same type
const validateInteractions = (data: InteractionRow[]): Interaction[] =>
  // Trust the database types - no need for runtime validation
  data.map(transformInteractionRow);
// Error recovery utilities
const createEmptyStats = (): StatsType => ({
  totalInteractions: 0,
  activeContacts: 0,
  interactionsPerContact: 0,
  averageResponseTime: 'N/A',
});

const setEmptyDataState = (
  setAllInteractions: (data: Interaction[]) => void,
  setStats: (stats: StatsType) => void,
  setTotalPages: (pages: number) => void,
  setTotalItems: (items: number) => void
) => {
  setAllInteractions([]);
  setStats(createEmptyStats());
  setTotalPages(0);
  setTotalItems(0);
};

// Create a type for the DataContext using built-in types only
interface DataContextType {
  dateRange: string;
  setDateRange: (range: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  setTotalPages: (total: number) => void;
  totalItems: number;
  setTotalItems: (total: number) => void;
  assistantId: string | null;
  setAssistantId: (id: string | null) => void;

  // Enhanced properties with better typing
  allInteractions: Interaction[];
  stats: StatsType;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  filterInteractions: (filters: FilterOptions) => Promise<void>;
  fetchInteractions: (params: FetchParams) => Promise<void>;
  // Add cache management
  clearCache: () => void;
  refreshData: () => Promise<void>;
  debouncedSearch: (searchTerm: string, delay?: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Memoized DataProvider to prevent unnecessary re-renders when parent components update
const DataProviderComponent = React.memo(({ children }: { children: ReactNode }) => {
  // Memoized date calculations to prevent unnecessary recalculations
  const defaultDateRange = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    return `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`;
  }, []);

  // State variables
  const [dateRange, setDateRange] = useState<string>(defaultDateRange);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  // Enhanced states with better performance
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [stats, setStats] = useState<StatsType>({
    totalInteractions: 0,
    activeContacts: 0,
    interactionsPerContact: 0,
    averageResponseTime: 'N/A',
  });
  const { isLoading, setIsLoading } = useLoadingState(false);

  // Cache management with enhanced TTL and size limits - properly typed
  const cacheRef = useRef<InteractionCache>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MAX_CACHE_SIZE = 20; // Maximum number of cache entries

  // Memoized cache key generator
  const generateCacheKey = useCallback(
    (params: FetchParams & FilterOptions) =>
      JSON.stringify({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? pageSize,
        searchTerm: params.searchTerm ?? '',
        assistantId: params.assistantId ?? 'all',
        fromDate: params.fromDate ?? '',
        toDate: params.toDate ?? '',
      }),
    [pageSize]
  );

  const getCachedData = useCallback(
    (key: string): Interaction[] | null => {
      const cached: CacheEntry | undefined = cacheRef.current.get(key);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      // Remove expired entry
      if (cached) {
        cacheRef.current.delete(key);
      }

      return null;
    },
    [CACHE_DURATION]
  );

  const setCachedData = useCallback((key: string, data: Interaction[]): void => {
    // Cleanup old cache entries if we're at the limit
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries (LRU strategy)
      const oldestKeys = [...cacheRef.current.keys()].slice(0, Math.floor(MAX_CACHE_SIZE / 2));

      for (const oldKey of oldestKeys) cacheRef.current.delete(oldKey);
    }

    const cacheEntry: CacheEntry = { data, timestamp: Date.now() };

    cacheRef.current.set(key, cacheEntry);
  }, []);

  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  // Enhanced stats calculation with memoization
  const calculateStats = useCallback((interactions: Interaction[]) => {
    const totalInteractions = interactions?.length ?? 0;

    // Safely extract chat data for uniqueContacts calculation
    const safeChats =
      interactions
        ?.map(i => i.chat)
        .filter((chat): chat is string => Boolean(chat) && String(chat).length > 0) ?? [];
    const uniqueContacts = new Set(safeChats).size;

    // Safely calculate average response time
    const avgResponseTime = interactions?.length
      ? `${Math.round(
          interactions.reduce((sum, interaction) => {
            const duration = interaction.duration ?? 0;

            return sum + duration;
          }, 0) /
            interactions.length /
            1000
        )}s`
      : 'N/A';

    return {
      totalInteractions,
      activeContacts: uniqueContacts,
      interactionsPerContact:
        uniqueContacts > 0 ? Math.round(totalInteractions / uniqueContacts) : 0,
      averageResponseTime: avgResponseTime,
    };
  }, []);

  // Enhanced filter interactions with caching and better error handling
  const filterInteractions = useCallback(
    async (filters: FilterOptions) => {
      const cacheKey = generateCacheKey({ ...filters, page: 1, pageSize });
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        setAllInteractions(cachedData);
        setStats(calculateStats(cachedData));
        setTotalPages(Math.ceil(cachedData.length / pageSize));
        setTotalItems(cachedData.length);

        return;
      }

      await withErrorHandling(
        async () => {
          setIsLoading(true);

          const supabase = createClient();

          // Get the current user
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            throw new Error('User not authenticated');
          }

          let query = supabase
            .from('interactions')
            .select('*')
            .eq('user_id', user.id) // Use auth user ID directly
            .order('interaction_time', { ascending: false });

          if (filters.fromDate) {
            query = query.gte('interaction_time', filters.fromDate);
          }
          if (filters.toDate) {
            query = query.lte('interaction_time', filters.toDate);
          }
          if (filters.assistantId) {
            query = query.eq('assistant_id', filters.assistantId);
          }

          const { data: interactions, error } = await query;

          if (error) {
            throw error;
          }

          const safeInteractions = validateInteractions(interactions ?? []);

          setCachedData(cacheKey, safeInteractions);
          setAllInteractions(safeInteractions);
          setStats(calculateStats(safeInteractions));
          setTotalPages(Math.ceil(safeInteractions.length / pageSize));
          setTotalItems(safeInteractions.length);
        },
        {
          toastTitle: 'Failed to filter interactions',
          fallbackMessage: 'Unable to filter interaction data',
        }
      );

      setIsLoading(false);
    },
    [pageSize, generateCacheKey, getCachedData, setCachedData, calculateStats, setIsLoading]
  );

  // Enhanced fetch interactions with caching
  const fetchInteractions = useCallback(
    async (params: FetchParams): Promise<void> => {
      const cacheKey = generateCacheKey({
        ...params,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? pageSize,
        fromDate: '',
        toDate: '',
      });
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        setAllInteractions(cachedData);
        setStats(calculateStats(cachedData));
        setTotalPages(Math.ceil(cachedData.length / (params.pageSize ?? pageSize)));
        setTotalItems(cachedData.length);

        return;
      }

      await withErrorHandling(
        async () => {
          setIsLoading(true);

          const supabase = createClient();

          // Get the current user
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            throw new Error('User not authenticated');
          }

          const page = params.page ?? 1;
          const limit = params.pageSize ?? pageSize;
          const offset = (page - 1) * limit;

          let query = supabase
            .from('interactions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id) // Use auth user ID directly
            .order('interaction_time', { ascending: false })
            .range(offset, offset + limit - 1);

          if (params.searchTerm) {
            query = query.or(
              `request.ilike.%${params.searchTerm}%,response.ilike.%${params.searchTerm}%`
            );
          }
          if (params.assistantId) {
            query = query.eq('assistant_id', params.assistantId);
          }

          const { data: interactions, error, count } = await query;

          if (error) {
            throw error;
          }

          const safeInteractions = validateInteractions(interactions ?? []);

          setCachedData(cacheKey, safeInteractions);
          setAllInteractions(safeInteractions);
          setStats(calculateStats(safeInteractions));
          setTotalPages(Math.ceil((count ?? 0) / limit));
          setTotalItems(count ?? 0);
        },
        {
          toastTitle: 'Failed to fetch interactions',
          fallbackMessage: 'Unable to load interaction data',
        }
      );

      // Handle error state manually since we can't use onError callback
      if (!allInteractions.length) {
        setEmptyDataState(setAllInteractions, setStats, setTotalPages, setTotalItems);
      }

      setIsLoading(false);
    },
    [
      pageSize,
      generateCacheKey,
      getCachedData,
      setCachedData,
      calculateStats,
      allInteractions.length,
      setIsLoading,
    ]
  );

  // Refresh data function
  const refreshData = useCallback(async () => {
    clearCache();
    await fetchInteractions({
      page: currentPage,
      pageSize,
      searchTerm,
      assistantId: assistantId ?? '',
    });
  }, [clearCache, fetchInteractions, currentPage, pageSize, searchTerm, assistantId]);

  // Debounced search functionality
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    (searchTerm: string, delay = 300) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        void fetchInteractions({ page: 1, pageSize, searchTerm, assistantId: assistantId ?? '' });
      }, delay);
    },
    [fetchInteractions, pageSize, assistantId]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: DataContextType = useMemo(
    () => ({
      dateRange,
      setDateRange,
      searchTerm,
      setSearchTerm,
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
      totalPages,
      setTotalPages,
      totalItems,
      setTotalItems,
      assistantId,
      setAssistantId,

      // Enhanced values
      allInteractions,
      stats,
      isLoading,
      setIsLoading,
      filterInteractions,
      fetchInteractions,
      clearCache,
      refreshData,
      debouncedSearch,
    }),
    [
      dateRange,
      searchTerm,
      currentPage,
      pageSize,
      totalPages,
      totalItems,
      assistantId,
      allInteractions,
      stats,
      isLoading,
      setIsLoading,
      filterInteractions,
      fetchInteractions,
      clearCache,
      refreshData,
      debouncedSearch,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
});

DataProviderComponent.displayName = 'DataProvider';

export const DataProvider = DataProviderComponent;

export function useData() {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
}
