'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

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

// Data validation utilities with proper typing
const isValidString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isValidOptionalString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isValidOptionalNumber = (value: unknown): value is number | null =>
  value === null || typeof value === 'number';

const isValidOptionalBoolean = (value: unknown): value is boolean | null =>
  value === null || typeof value === 'boolean';

const validateInteractionRow = (data: unknown): data is InteractionRow => {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    isValidString(obj.id) &&
    isValidString(obj.request) &&
    isValidString(obj.response) &&
    isValidOptionalString(obj.assistant_id) &&
    isValidOptionalString(obj.chat) &&
    isValidOptionalNumber(obj.cost_estimate) &&
    isValidOptionalString(obj.created_at) &&
    isValidOptionalNumber(obj.duration) &&
    isValidOptionalNumber(obj.input_tokens) &&
    isValidOptionalString(obj.interaction_time) &&
    isValidOptionalBoolean(obj.is_error) &&
    isValidOptionalString(obj.monthly_period) &&
    isValidOptionalNumber(obj.output_tokens) &&
    isValidOptionalNumber(obj.token_usage) &&
    isValidOptionalString(obj.updated_at) &&
    isValidOptionalString(obj.user_id)
  );
};

const transformToInteraction = (rawData: InteractionRow): Interaction => {
  return rawData as Interaction;
};

const validateInteractions = (data: unknown): Interaction[] => {
  if (!Array.isArray(data)) return [];

  return data.filter(validateInteractionRow).map(transformToInteraction);
};

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
type DataContextType = {
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
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Memoized DataProvider to prevent unnecessary re-renders when parent components update
export const DataProvider = React.memo(function DataProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Memoized date calculations to prevent unnecessary recalculations
  const defaultDateRange = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

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
    (params: FetchParams & FilterOptions) => {
      return JSON.stringify({
        page: params.page || 1,
        pageSize: params.pageSize || pageSize,
        searchTerm: params.searchTerm || '',
        assistantId: params.assistantId || 'all',
        fromDate: params.fromDate || '',
        toDate: params.toDate || '',
      });
    },
    [pageSize]
  );

  // Enhanced cache utility functions with proper typing
  const getCachedData = useCallback((key: string): Interaction[] | null => {
    const cached: CacheEntry | undefined = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    // Remove expired entry
    if (cached) {
      cacheRef.current.delete(key);
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: Interaction[]): void => {
    // Cleanup old cache entries if we're at the limit
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries (LRU strategy)
      const oldestKeys = Array.from(cacheRef.current.keys()).slice(
        0,
        Math.floor(MAX_CACHE_SIZE / 2)
      );
      oldestKeys.forEach(oldKey => cacheRef.current.delete(oldKey));
    }

    const cacheEntry: CacheEntry = { data, timestamp: Date.now() };
    cacheRef.current.set(key, cacheEntry);
  }, []);

  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  // Enhanced stats calculation with memoization
  const calculateStats = useCallback((interactions: Interaction[]) => {
    const totalInteractions = interactions?.length || 0;

    // Safely extract chat data for uniqueContacts calculation
    const safeChats =
      interactions
        ?.map(i => {
          if (typeof i.chat === 'string') {
            return i.chat;
          }
          return null;
        })
        .filter(Boolean) || [];
    const uniqueContacts = new Set(safeChats).size;

    // Safely calculate average response time
    const avgResponseTime = interactions?.length
      ? `${Math.round(
          interactions.reduce((sum, interaction) => {
            const duration = typeof interaction.duration === 'number' ? interaction.duration : 0;
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
          let query = supabase
            .from('interactions')
            .select('*')
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

          const safeInteractions = validateInteractions(interactions || []);
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
    [pageSize, generateCacheKey, getCachedData, setCachedData, calculateStats]
  );

  // Enhanced fetch interactions with caching
  const fetchInteractions = useCallback(
    async (params: FetchParams): Promise<void> => {
      const cacheKey = generateCacheKey({
        ...params,
        page: params.page || 1,
        pageSize: params.pageSize || pageSize,
        fromDate: '',
        toDate: '',
      });
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        setAllInteractions(cachedData);
        setStats(calculateStats(cachedData));
        setTotalPages(Math.ceil(cachedData.length / (params.pageSize || pageSize)));
        setTotalItems(cachedData.length);
        return;
      }

      await withErrorHandling(
        async () => {
          setIsLoading(true);

          const supabase = createClient();
          const page = params.page ?? 1;
          const limit = params.pageSize ?? pageSize;
          const offset = (page - 1) * limit;

          let query = supabase
            .from('interactions')
            .select('*', { count: 'exact' })
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

          const safeInteractions = validateInteractions(interactions || []);
          setCachedData(cacheKey, safeInteractions);
          setAllInteractions(safeInteractions);
          setStats(calculateStats(safeInteractions));
          setTotalPages(Math.ceil((count || 0) / limit));
          setTotalItems(count || 0);
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
    ]
  );

  // Refresh data function
  const refreshData = useCallback(async () => {
    clearCache();
    await fetchInteractions({
      page: currentPage,
      pageSize,
      searchTerm,
      assistantId: assistantId || '',
    });
  }, [clearCache, fetchInteractions, currentPage, pageSize, searchTerm, assistantId]);

  // Debounced search functionality
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    (searchTerm: string, delay: number = 300) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchInteractions({ page: 1, pageSize, searchTerm, assistantId: assistantId || '' });
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
      filterInteractions,
      fetchInteractions,
      clearCache,
      refreshData,
      debouncedSearch,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
});

export function useData() {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
}
