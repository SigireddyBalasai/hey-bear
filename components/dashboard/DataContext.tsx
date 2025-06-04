'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/client';

// Use the database types for interactions
type Interaction = Database['public']['Tables']['interactions']['Row'];

interface StatsType {
  totalInteractions: number;
  activeContacts: number;
  interactionsPerContact: number;
  averageResponseTime: string;
}

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

  // Added properties
  allInteractions: Interaction[]; // Changed from any[]
  stats: StatsType; // Changed from any
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  filterInteractions: (filters: { fromDate?: string; toDate?: string }) => Promise<void>; // Made async
  fetchInteractions: (params: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    assistantId?: string | undefined;
  }) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // Calculate default dates (last 30 days)
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

  // Default date range (last 30 days)
  const defaultDateRange = `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`;

  // State variables
  const [dateRange, setDateRange] = useState<string>(defaultDateRange);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  // Added states
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]); // Changed from any[]
  const [stats, setStats] = useState<StatsType>({
    totalInteractions: 0,
    activeContacts: 0,
    interactionsPerContact: 0,
    averageResponseTime: 'N/A',
  }); // Changed from any
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter interactions based on date range
  const filterInteractions = async (filters: { fromDate?: string; toDate?: string }) => {
    console.log('Filtering interactions with:', filters);
    setIsLoading(true);

    try {
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

      // Execute the query safely
      const result = await query;

      // Safely extract data with proper fallbacks
      const interactions = result?.data || [];
      const error = result?.error || null;

      if (error) {
        // Check for empty error object - a common case that causes cryptic errors
        if (Object.keys(error).length === 0) {
          console.warn('Received empty error object from database query');
          // Continue with empty data rather than throwing
        } else {
          // Log the error but don't throw - handle it gracefully
          console.error('Error filtering interactions:', error);
        }

        // Set empty data states instead of throwing errors
        setAllInteractions([]);
        setStats({
          totalInteractions: 0,
          activeContacts: 0,
          interactionsPerContact: 0,
          averageResponseTime: 'No/A',
        });
        setTotalPages(0);
        setTotalItems(0);
        setIsLoading(false);
        return;
      }

      // Update state with filtered data - ensure proper typing
      setAllInteractions((interactions || []) as Interaction[]);

      // Calculate stats from filtered data
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

      setStats({
        totalInteractions,
        activeContacts: uniqueContacts,
        interactionsPerContact:
          uniqueContacts > 0 ? Math.round(totalInteractions / uniqueContacts) : 0,
        averageResponseTime: avgResponseTime,
      });

      setTotalPages(Math.ceil(totalInteractions / pageSize));
      setTotalItems(totalInteractions);
    } catch (error) {
      console.error('Failed to filter interactions:', error);
      // Set empty state on error
      setAllInteractions([]);
      setStats({
        totalInteractions: 0,
        activeContacts: 0,
        interactionsPerContact: 0,
        averageResponseTime: 'N/A',
      });
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractions = async (params: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    assistantId?: string | undefined;
  }): Promise<void> => {
    console.log('Fetching interactions with params:', params);
    setIsLoading(true);

    try {
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

      // Execute the query safely
      const result = await query;

      // Safely extract data with proper fallbacks
      const interactions = result?.data || [];
      const error = result?.error || null;
      const count = result?.count || 0;

      if (error) {
        // Check for empty error object - a common case that causes cryptic errors
        if (!error || Object.keys(error).length === 0) {
          console.warn('Received empty error object from database query - treating as no error');
          // Continue with processing the data normally since empty error often means no actual error
        } else if (
          error.message &&
          error.message.includes('The schema must be one of the following')
        ) {
          // Handle schema access error specifically
          console.error('Schema access error:', error.message);
          console.info(
            'This error occurs when Supabase needs schema permissions. Run the migrations to fix this.'
          );
          // Try to fall back to public schema
          try {
            const fallbackQuery = await supabase

              .from('interactions')
              .select('*', { count: 'exact' })
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);

            if (!fallbackQuery.error && fallbackQuery.data) {
              // Process the fallback data instead of returning
              setAllInteractions(fallbackQuery.data as Interaction[]);
              const count = fallbackQuery.count || 0;

              setTotalPages(Math.ceil(count / limit));
              setTotalItems(count);
              setIsLoading(false);
              return; // Return void as required by the function signature
            }
          } catch (fallbackError) {
            console.warn('Fallback to public schema failed:', fallbackError);
          }
          
          // Set empty data states for schema errors
          setAllInteractions([]);
          setStats({
            totalInteractions: 0,
            activeContacts: 0,
            interactionsPerContact: 0,
            averageResponseTime: 'N/A',
          });
          setTotalPages(0);
          setTotalItems(0);
          setIsLoading(false);
          return;
        } else {
          // Log the error with better formatting
          console.error('Error fetching interactions:', {
            message: error.message || 'Unknown error',
            code: error.code || 'No code',
            details: error.details || 'No details',
            hint: error.hint || 'No hint'
          });
          
          // Set empty data states for real errors
          setAllInteractions([]);
          setStats({
            totalInteractions: 0,
            activeContacts: 0,
            interactionsPerContact: 0,
            averageResponseTime: 'N/A',
          });
          setTotalPages(0);
          setTotalItems(0);
          setIsLoading(false);
          return;
        }      }

      // Update state with real data - ensure proper typing
      setAllInteractions((interactions || []) as Interaction[]);

      // Calculate stats from real data
      const totalInteractions = count || 0;

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

      setStats({
        totalInteractions,
        activeContacts: uniqueContacts,
        interactionsPerContact:
          uniqueContacts > 0 ? Math.round(totalInteractions / uniqueContacts) : 0,
        averageResponseTime: avgResponseTime,
      });

      setTotalPages(Math.ceil(totalInteractions / limit));
      setTotalItems(totalInteractions);
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
      // Set empty state on error
      setAllInteractions([]);
      setStats({
        totalInteractions: 0,
        activeContacts: 0,
        interactionsPerContact: 0,
        averageResponseTime: 'N/A',
      });
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: DataContextType = {
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

    // Added values
    allInteractions,
    stats,
    isLoading,
    setIsLoading,
    filterInteractions,
    fetchInteractions,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
}
