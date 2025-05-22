import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { DateRange } from "react-day-picker";
import { useData } from '../DataContext';
import { Database, Tables } from '@/lib/db.types';
import { toast } from 'sonner';
import { table } from 'console';

type InteractionTable = Tables<{ schema: 'analytics'; table: 'interactions' }>;

interface InteractionFilters extends Partial<InteractionTable> {
  dateRange?: DateRange;
  minTokens?: number | null;
  maxTokens?: number | null;
  minCost?: number | null;
  maxCost?: number | null;
  isError?: boolean | null;
}

interface FilterOptions {
  withAssistant?: boolean;
  withUser?: boolean;
  withSearch?: boolean;
  withDateRange?: boolean;
  withPhoneNumber?: boolean;
  withStatus?: boolean;
  withSorting?: boolean;
}

/**
 * Hook for working with dashboard filters
 * Provides utility functions for applying filters to Supabase queries
 */
export function useFilters() {
  const { 
    dateRange, 
    assistantId,
    searchTerm, 
    currentPage,
    pageSize,
    setCurrentPage
  } = useData();
  
  /**
   * Parse a date range string into startDate and endDate objects
   * @param range - Date range string in format "Jan 1, 2023 - Feb 1, 2023"
   */
  const parseDateRange = (range: string = dateRange): DateRange => {
    try {
      const dates = range.split(' - ');
      if (dates.length === 2) {
        return {
          from: new Date(dates[0]),
          to: new Date(dates[1])
        };
      }
    } catch (error) {
      console.error('Error parsing date range:', error);
    }
    
    return {
      from: undefined,
      to: undefined
    };
  };
   
  /**
   * Format a date in the standard format used by the dashboard
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  /**
   * Create a date range string for the last N days
   */
  const getLastNDaysRange = (days: number): string => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    return `${formatDate(pastDate)} - ${formatDate(today)}`;
  };
  
  /**
   * Create date range objects for common time periods
   */
  const getCommonDateRanges = () => {
    const today = new Date();
    
    // Last 7 days
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);
    
    // Last 30 days
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);
    
    // Last 90 days
    const last90Days = new Date();
    last90Days.setDate(today.getDate() - 90);
    
    // Current month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Previous month
    const firstOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      today: {
        label: 'Today',
        range: `${formatDate(today)} - ${formatDate(today)}`
      },
      yesterday: {
        label: 'Yesterday',
        range: (() => {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          return `${formatDate(yesterday)} - ${formatDate(yesterday)}`;
        })()
      },
      last7Days: {
        label: 'Last 7 Days',
        range: `${formatDate(last7Days)} - ${formatDate(today)}`
      },
      last30Days: {
        label: 'Last 30 Days',
        range: `${formatDate(last30Days)} - ${formatDate(today)}`
      },
      last90Days: {
        label: 'Last 90 Days',
        range: `${formatDate(last90Days)} - ${formatDate(today)}`
      },
      thisMonth: {
        label: 'This Month',
        range: `${formatDate(firstOfMonth)} - ${formatDate(today)}`
      },
      previousMonth: {
        label: 'Previous Month',
        range: `${formatDate(firstOfPreviousMonth)} - ${formatDate(lastOfPreviousMonth)}`
      }
    };
  };
  
  /**
   * Build the query params for token usage filters
   */
  const buildTokenFilters = (
    query: any,
    minTokens?: number | null,
    maxTokens?: number | null
  ) => {
    if (minTokens !== undefined && minTokens !== null) {
      query = query.gte('token_usage', minTokens);
    }
    
    if (maxTokens !== undefined && maxTokens !== null) {
      query = query.lte('token_usage', maxTokens);
    }
    
    return query;
  };

  /**
   * Build the query params for cost filters
   */
  const buildCostFilters = (
    query: any,
    minCost?: number | null,
    maxCost?: number | null
  ) => {
    if (minCost !== undefined && minCost !== null) {
      query = query.gte('cost_estimate', minCost);
    }
    
    if (maxCost !== undefined && maxCost !== null) {
      query = query.lte('cost_estimate', maxCost);
    }
    
    return query;
  };

  /**
   * Build the query params for error filters
   */
  const buildErrorFilter = (
    query: any,
    isError?: boolean | null
  ) => {
    if (isError !== undefined && isError !== null) {
      query = query.eq('is_error', isError);
    }
    
    return query;
  };

  /**
   * Build the query params for date range filters
   */
  const buildDateRangeFilter = (
    query: any,
    dateRange?: DateRange
  ) => {
    if (dateRange?.from) {
      query = query.gte('interaction_time', dateRange.from.toISOString());
    }
    
    if (dateRange?.to) {
      // Add one day to include the end date
      const endDate = new Date(dateRange.to);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('interaction_time', endDate.toISOString());
    }
    
    return query;
  };

  /**
   * Build complete filter set for interactions query
   */
  const buildInteractionFilters = (
    query: any,
    filters: InteractionFilters
  ) => {
    const {
      dateRange,
      minTokens,
      maxTokens,
      minCost,
      maxCost,
      isError,
      ...restFilters
    } = filters;

    // Apply base filters (exact matches)
    Object.entries(restFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply range filters
    query = buildTokenFilters(query, minTokens, maxTokens);
    query = buildCostFilters(query, minCost, maxCost);
    query = buildErrorFilter(query, isError);
    query = buildDateRangeFilter(query, dateRange);

    return query;
  };

  /**
   * Apply interaction filters to query
   */
  const applyInteractionFilters = (
    filters: Partial<Tables<{ schema: 'analytics'; table: 'interactions' }>> & {
      dateRange?: DateRange;
      minTokens?: number | null;
      maxTokens?: number | null;
      minCost?: number | null;
      maxCost?: number | null;
      isError?: boolean | null;
    }
  ) => {
    return buildInteractionFilters({}, filters);
  };

  /**
   * Filter interactions by phone number
   */
  const filterByPhoneNumber = (interactions: any[], phoneNumber?: string) => {
    if (!phoneNumber) return interactions;
    return interactions.filter(i => i.phoneNumber === phoneNumber);
  };

  /**
   * Filter interactions by message content
   */
  const filterByMessage = (interactions: any[], message?: string) => {
    if (!message) return interactions;
    return interactions.filter(i => 
      i.message?.toLowerCase().includes(message.toLowerCase())
    );
  };

  /**
   * Filter interactions by assistant name
   */
  const filterByAssistant = (interactions: any[], assistantName?: string) => {
    if (!assistantName) return interactions;
    return interactions.filter(i => 
      i.assistantName?.toLowerCase().includes(assistantName.toLowerCase())
    );
  };

  /**
   * Filter interactions by status
   */
  const filterByStatus = (interactions: any[], status?: string) => {
    if (!status) return interactions;
    return interactions.filter(i => i.status === status);
  };

  /**
   * Apply legacy filters to an interactions query
   */
  const applyLegacyInteractionFilters = (
    filters: Partial<Tables<{ schema: 'analytics'; table: 'interactions' }>> & {
      dateRange?: DateRange;
      minTokens?: number | null;
      maxTokens?: number | null;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      phoneNumber?: string | null;
      assistant_id?: string;
      user_id?: string;
      request?: string;
      response?: string;
      is_error?: boolean;
    } = {},
    options: FilterOptions = {
      withAssistant: true,
      withUser: false,
      withSearch: true,
      withDateRange: true,
      withPhoneNumber: false,
      withStatus: false
    }
  ) => {
    const supabase = createClient();
    let query = supabase.schema('analytics').from('interactions') as any;
    
    // Use provided filters or fall back to context values
    const appliedFilters = {
      dateRange: filters.dateRange || (options.withDateRange ? parseDateRange() : undefined),
      assistant_id: filters.assistant_id || (options.withAssistant ? assistantId : undefined),
      user_id: filters.user_id,
      request: filters.request,
      response: filters.response,
      is_error: filters.is_error,
      phoneNumber: filters.phoneNumber,
      minTokens: filters.minTokens,
      maxTokens: filters.maxTokens,
      sortBy: filters.sortBy || 'interaction_time',
      sortDirection: filters.sortDirection || 'desc'
    };
    
    // Apply search filter with searchTerm from context if not in filters
    const searchTermToUse = options.withSearch ? searchTerm : null;
    
    // Apply date range filter
    if (options.withDateRange && appliedFilters.dateRange) {
      if (appliedFilters.dateRange.from) {
        query = query.gte('interaction_time', appliedFilters.dateRange.from.toISOString());
      }
      if (appliedFilters.dateRange.to) {
        query = query.lte('interaction_time', appliedFilters.dateRange.to.toISOString());
      }
    }
    
    // Apply assistant filter
    if (options.withAssistant && appliedFilters.assistant_id) {
      query = query.eq('assistant_id', appliedFilters.assistant_id);
    }
    
    // Apply user filter
    if (options.withUser && appliedFilters.user_id) {
      query = query.eq('user_id', appliedFilters.user_id);
    }
    
    // Apply search filter
    if (options.withSearch && searchTermToUse) {
      query = query.or(`request.ilike.%${searchTermToUse}%,response.ilike.%${searchTermToUse}%`);
    }
    
    // Apply error filter
    if (options.withStatus && appliedFilters.is_error !== undefined) {
      query = query.eq('is_error', appliedFilters.is_error);
    }
    
    // Apply phone number filter
    if (options.withPhoneNumber && appliedFilters.phoneNumber) {
      // Find interactions by phone number (checking chat JSON)
      query = query.ilike('chat', `%${appliedFilters.phoneNumber}%`);
    }
    
    // Apply token filters
    if (appliedFilters.minTokens !== undefined && appliedFilters.minTokens !== null) {
      query = query.gte('token_usage', appliedFilters.minTokens);
    }
    
    if (appliedFilters.maxTokens !== undefined && appliedFilters.maxTokens !== null) {
      query = query.lte('token_usage', appliedFilters.maxTokens);
    }
    
    // Apply sorting
    if (options.withSorting) {
      query = query.order(appliedFilters.sortBy, { ascending: appliedFilters.sortDirection === 'asc' });
    }
    
    return query;
  };
  
  /**
   * Apply filters to a usage statistics query
   * Using the Tables type directly from db.types
   */
  const applyUsageStatisticsFilters = (
    filters: Partial<Tables<'usage_statistics'>> & {
      dateRange?: DateRange;
      minCost?: number | null;
      maxCost?: number | null; 
      minTokens?: number | null;
      maxTokens?: number | null;
    } = {},
    options: FilterOptions = {
      withDateRange: true,
      withAssistant: true
    }
  ) => {
    const supabase = createClient();
    let query = supabase.from('usage_statistics') as any;
    
    // Use provided filters or fall back to context values
    const appliedFilters = {
      dateRange: filters.dateRange || (options.withDateRange ? parseDateRange() : undefined),
      entity_id: filters.entity_id || (options.withAssistant ? assistantId : undefined),
      entity_type: filters.entity_type || (options.withAssistant ? 'assistant' : undefined),
      period: filters.period,
      minCost: filters.minCost,
      maxCost: filters.maxCost,
      minTokens: filters.minTokens,
      maxTokens: filters.maxTokens
    };
    
    // Apply date range filter using the period column
    if (options.withDateRange && appliedFilters.dateRange) {
      if (appliedFilters.dateRange.from) {
        query = query.gte('period', appliedFilters.dateRange.from.toISOString());
      }
      if (appliedFilters.dateRange.to) {
        query = query.lte('period', appliedFilters.dateRange.to.toISOString());
      }
    }
    
    // Apply entity filters
    if (appliedFilters.entity_id) {
      query = query.eq('entity_id', appliedFilters.entity_id);
    }
    
    if (appliedFilters.entity_type) {
      query = query.eq('entity_type', appliedFilters.entity_type);
    }
    
    // Apply specific period filter
    if (appliedFilters.period) {
      query = query.eq('period', appliedFilters.period);
    }
    
    // Apply cost filters
    if (appliedFilters.minCost !== undefined && appliedFilters.minCost !== null) {
      query = query.gte('cost_estimate', appliedFilters.minCost);
    }
    
    if (appliedFilters.maxCost !== undefined && appliedFilters.maxCost !== null) {
      query = query.lte('cost_estimate', appliedFilters.maxCost);
    }
    
    // Apply token filters
    if (appliedFilters.minTokens !== undefined && appliedFilters.minTokens !== null) {
      query = query.gte('token_usage', appliedFilters.minTokens);
    }
    
    if (appliedFilters.maxTokens !== undefined && appliedFilters.maxTokens !== null) {
      query = query.lte('token_usage', appliedFilters.maxTokens);
    }
    
    return query;
  };
  
  /**
   * Apply filters to a phone numbers query
   * Using the Tables type directly from db.types
   */
  const applyPhoneNumberFilters = (
    filters: Partial<Tables<'phone_numbers'>> = {},
    options: FilterOptions = {
      withAssistant: true
    }
  ) => {
    const supabase = createClient();
    let query = supabase.from('phone_numbers') as any;
    
    // Use provided filters or fall back to context values
    const appliedFilters = {
      is_assigned: filters.is_assigned,
      assistant_id: filters.assistant_id || (options.withAssistant ? assistantId : undefined),
      country: filters.country,
      status: filters.status
    };
    
    // Apply assignment filter
    if (appliedFilters.is_assigned !== undefined) {
      query = query.eq('is_assigned', appliedFilters.is_assigned);
    }
    
    // Apply assistant filter
    if (options.withAssistant && appliedFilters.assistant_id) {
      query = query.eq('assistant_id', appliedFilters.assistant_id);
    }
    
    // Apply country filter
    if (appliedFilters.country) {
      query = query.eq('country', appliedFilters.country);
    }
    
    // Apply status filter
    if (appliedFilters.status) {
      query = query.eq('status', appliedFilters.status);
    }
    
    return query;
  };
  
  /**
   * Apply pagination to a Supabase query
   */
  const applyPagination = <T>(
    query: T,
    page: number = currentPage,
    itemsPerPage: number = pageSize
  ) => {
    const offset = (page - 1) * itemsPerPage;
    // @ts-ignore - We know this is a Supabase query with range method
    return query.range(offset, offset + itemsPerPage - 1);
  };
  
  /**
   * Get current user ID from auth
   */
  const getCurrentUserId = async () => {
    const supabase = createClient();
    
    // First get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Error fetching user');
    }
    
    // Get user ID from auth.users table
    const { data: userData, error: userDataError } = await supabase
      .schema('users')
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData) {
      throw new Error('Error fetching user data');
    }
    
    return userData.id;
  };
  
  /**
   * Helper to fetch available assistants for filtering
   */
  const getAvailableAssistants = async () => {
    const supabase = createClient();
    
    try {
      // Get the current user ID
      const userId = await getCurrentUserId();
      
      // Fetch assistants for the current user
      const { data: assistants, error } = await supabase
        .schema('assistants')
        .from('assistants')
        .select('id, name')
        .eq('user_id', userId)
        .order('name');
        
      if (error) throw error;
      
      return assistants as Tables<{ schema: 'assistants'; table: 'assistants' }>[];
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return [];
    }
  };
  
  /**
   * Helper to fetch interaction metrics for a specific interaction
   */
  const getInteractionMetrics = async (interactionId: string) => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .schema('analytics')
        .from('interaction_metrics')
        .select('*')
        .eq('interaction_id', interactionId)
        .single();
        
      if (error) throw error;
      
      return data as Tables<{schema:"analytics";table:'interaction_metrics'}>;
    } catch (error) {
      console.error('Error fetching interaction metrics:', error);
      return null;
    }
  };
  
  /**
   * Reset page to 1 when filter changes
   */
  const resetPagination = () => {
    setCurrentPage(1);
  };
  
  /**
   * A higher-level function that fetches interactions with pagination handling
   */
  const fetchFilteredInteractions = async (
    filters: Partial<InteractionTable> & {
      dateRange?: DateRange;
      minTokens?: number | null;
      maxTokens?: number | null;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      phoneNumber?: string | null;
    } = {}
  ) => {
    try {
      const query = applyInteractionFilters(filters)
        .select('*, phone_numbers!left(phone_number)', { count: 'exact' });
      
      const paginatedQuery = applyPagination(query);
      
      const { data, count, error } = await paginatedQuery;
      
      if (error) {
        throw error;
      }
      
      return {
        data: data as Tables<{schema:"analytics";table:'interactions'}>[],
        count
      };
    } catch (error) {
      console.error('Error fetching interactions:', error);
      return {
        data: [],
        count: 0
      };
    }
  };
  
  /**
   * A higher-level function that fetches usage statistics with pagination handling
   */
  const fetchFilteredUsageStatistics = async (
    filters: Partial<Tables<'usage_statistics'>> & {
      dateRange?: DateRange;
      minCost?: number | null;
      maxCost?: number | null; 
      minTokens?: number | null;
      maxTokens?: number | null;
    } = {}
  ) => {
    try {
      const query = applyUsageStatisticsFilters(filters)
        .select('*, assistants!inner(name)');
      
      const paginatedQuery = applyPagination(query);
      
      const { data, count, error } = await paginatedQuery;
      
      if (error) {
        throw error;
      }
      
      return {
        data: data as Tables<'usage_statistics'>[],
        count
      };
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      return {
        data: [],
        count: 0
      };
    }
  };
  
  /**
   * A higher-level function that fetches phone numbers with pagination handling
   */
  const fetchFilteredPhoneNumbers = async (
    filters: Partial<Tables<'phone_numbers'>> = {}
  ) => {
    try {
      const query = applyPhoneNumberFilters(filters)
        .select('*, assistants!inner(name)');
      
      const paginatedQuery = applyPagination(query);
      
      const { data, count, error } = await paginatedQuery;
      
      if (error) {
        throw error;
      }
      
      return {
        data: data as Tables<'phone_numbers'>[],
        count
      };
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      return {
        data: [],
        count: 0
      };
    }
  };
  
  return {
    dateRange,
    assistantId,
    searchTerm,
    currentPage,
    pageSize,
    parseDateRange,
    formatDate,
    getLastNDaysRange,
    getCommonDateRanges,
    buildInteractionFilters,
    applyInteractionFilters,
    filterByPhoneNumber,
    filterByMessage,
    filterByAssistant,
    filterByStatus,
    applyUsageStatisticsFilters,
    applyPhoneNumberFilters,
    applyPagination,
    getCurrentUserId,
    getAvailableAssistants,
    getInteractionMetrics,
    resetPagination,
    fetchFilteredInteractions,
    fetchFilteredUsageStatistics,
    fetchFilteredPhoneNumbers
  };
}