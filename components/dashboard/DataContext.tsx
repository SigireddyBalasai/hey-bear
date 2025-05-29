'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Define more specific types for Interaction and Stats
interface Interaction {
  id: string;
  message: string;
  // Add other relevant interaction properties here
  timestamp?: string; // Example property
  userId?: string; // Example property
}

interface StatsType {
  totalInteractions: number;
  activeContacts: number;
  interactionsPerContact: number;
  averageResponseTime: string; // Or number if it's in seconds/ms
  // Add other relevant stats properties here
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

  // Placeholder implementations for new functions
  const filterInteractions = async (filters: { fromDate?: string; toDate?: string }) => {
    console.log('Filtering interactions with:', filters);
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Implement actual filtering logic:
    // - Fetch data based on filters
    // - Update allInteractions, stats, totalPages, totalItems
    // For now, setting dummy data:
    setAllInteractions([
      { id: 'filtered1', message: `Filtered data from ${filters.fromDate} to ${filters.toDate}` },
    ]);
    setStats({
      totalInteractions: 1,
      activeContacts: 1,
      interactionsPerContact: 1,
      averageResponseTime: '5s',
    });
    setTotalPages(1);
    setTotalItems(1);
    setIsLoading(false);
  };

  const fetchInteractions = async (params: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    assistantId?: string | undefined;
  }) => {
    console.log('Fetching interactions with params:', params);
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // TODO: Implement actual fetching logic:
    // - Fetch data based on params
    // - Update allInteractions, stats, totalPages, totalItems
    // For now, setting dummy data:
    const page = params.page ?? 1;
    setAllInteractions([
      { id: `item${(page - 1) * 2 + 1}`, message: `Fetched for page ${page}, item 1` },
      { id: `item${(page - 1) * 2 + 2}`, message: `Fetched for page ${page}, item 2` },
    ]);
    setStats({
      totalInteractions: 50,
      activeContacts: 10,
      interactionsPerContact: 5,
      averageResponseTime: '10s',
    });
    setTotalPages(5); // Assuming 5 total pages for dummy data
    setTotalItems(10); // Assuming 10 total items for dummy data (2 per page * 5 pages)
    setIsLoading(false);
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
