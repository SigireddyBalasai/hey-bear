"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Interaction, DashboardStats } from './models';
import logger from '@/lib/logger';

// Create a logger with context
const contextLogger = logger.withContext('DataContext');

interface DataContextType {
  allInteractions: Interaction[];
  stats: DashboardStats;
  dateRange: string;
  setDateRange: (range: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  filterInteractions: (filters: any) => void;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const defaultStats: DashboardStats = {
  totalInteractions: 0,
  activeContacts: 0,
  interactionsPerContact: 0,
  averageResponseTime: '0s',
  phoneNumbers: '0/10',
  smsReceived: '0/200',
  smsSent: '0/200',
  planType: 'Personal'
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  contextLogger.debug('Initializing DataProvider');
  
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [dateRange, setDateRange] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Set default date range from 1 month ago to today
  useEffect(() => {
    contextLogger.debug('Setting default date range');
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    setFilters({
      fromDate: oneMonthAgo.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      phoneNumber: 'all'
    });
  }, []);

  const fetchInteractions = async (params: Record<string, string> = {}) => {
    const opLogger = contextLogger.startOperation('fetchInteractions');
    setIsLoading(true);
    setError(null);
    
    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    queryParams.append('page', currentPage.toString());
    queryParams.append('pageSize', '5');
    
    // Add search term if present
    if (searchTerm) {
      queryParams.append('searchTerm', searchTerm);
    }
    
    // Add filters if present
    if (filters) {
      if (filters.fromDate) queryParams.append('startDate', filters.fromDate);
      if (filters.toDate) queryParams.append('endDate', filters.toDate);
      if (filters.phoneNumber && filters.phoneNumber !== 'all') {
        queryParams.append('phoneNumber', filters.phoneNumber);
      }
    }
    
    // Add any additional parameters passed in
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    contextLogger.debug('Fetching interactions', { queryString, page: currentPage });
    
    try {
      const response = await fetch(`/api/dashboard/interactions?${queryString}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      contextLogger.debug('Received data', { 
        interactionsCount: data.interactions.length,
        totalPages: data.pagination.totalPages,
        dateRange: data.dateRange,
        stats: data.stats,
        data
      });
      
      setAllInteractions(data.interactions);
      setStats(data.stats);
      setDateRange(data.dateRange);
      setTotalPages(data.pagination.totalPages);
      opLogger.end({ success: true });
      
    } catch (error) {
      contextLogger.error('Error fetching interactions', { error });
      // Fallback to empty data on error
      setAllInteractions([]);
      setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      opLogger.end({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch when filters are set
  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      contextLogger.debug('Initial data fetch with filters', { filters });
      fetchInteractions();
    }
  }, [filters.fromDate, filters.toDate]);

  // Fetch when pagination or search changes
  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      contextLogger.debug('Fetching due to pagination/search change', { page: currentPage, searchTerm });
      fetchInteractions();
    }
  }, [currentPage, searchTerm]);

  const filterInteractions = (newFilters: any) => {
    contextLogger.debug('Applying new filters', { newFilters });
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <DataContext.Provider 
      value={{ 
        allInteractions, 
        stats, 
        dateRange, 
        setDateRange, 
        isLoading, 
        setIsLoading,
        filterInteractions,
        totalPages,
        currentPage,
        setCurrentPage,
        searchTerm,
        setSearchTerm
      }}
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-5 right-5 z-50 shadow-md">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    contextLogger.error('useData called outside of DataProvider');
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
