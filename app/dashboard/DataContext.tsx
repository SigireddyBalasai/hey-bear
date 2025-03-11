"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Interaction, DashboardStats, DashboardResponse } from './models';

interface DataContextProps {
  allInteractions: Interaction[];
  filteredInteractions: Interaction[];
  stats: DashboardStats;
  dateRange: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  filterInteractions: (filters: FilterOptions) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalItems: number;
  totalPages: number;
  fetchInteractions: (options: FetchOptions) => Promise<void>;
  assistantId: string | null; // Added assistantId
  setAssistantId: (id: string | null) => void; // Added setter
}

interface FilterOptions {
  fromDate?: string;
  toDate?: string;
  assistantId?: string; // Changed from phoneNumber to assistantId
  messageType?: string;
}

interface FetchOptions {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  assistantId?: string; // Changed from phoneNumber to assistantId
  searchTerm?: string;
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

const DataContext = createContext<DataContextProps>({
  allInteractions: [],
  filteredInteractions: [],
  stats: defaultStats,
  dateRange: '',
  isLoading: true,
  setIsLoading: () => {},
  filterInteractions: () => {},
  searchTerm: '',
  setSearchTerm: () => {},
  currentPage: 1,
  setCurrentPage: () => {},
  pageSize: 5,
  setPageSize: () => {},
  totalItems: 0,
  totalPages: 1,
  fetchInteractions: async () => {},
  assistantId: null, // Added default value for assistantId
  setAssistantId: () => {}, // Added default setter
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [filteredInteractions, setFilteredInteractions] = useState<Interaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [dateRange, setDateRange] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [assistantId, setAssistantId] = useState<string | null>(null); // Added state for assistantId

  // Function to fetch interactions from the API
  const fetchInteractions = async ({
    page = currentPage,
    pageSize: size = pageSize,
    startDate,
    endDate,
    assistantId: id = assistantId ?? 'all',
    searchTerm: search = searchTerm
  }: FetchOptions) => {
    setIsLoading(true);
    
    try {
      console.log('Fetching interactions with params:', { 
        page, 
        pageSize: size, 
        startDate, 
        endDate, 
        assistantId: id || 'all', 
        searchTerm: search 
      });
      
      // Build the query URL with parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString()
      });
      
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      // Always pass assistantId but default to 'all' if not provided
      queryParams.append('assistantId', id || 'all');
      if (search) queryParams.append('searchTerm', search);
      
      const apiUrl = `/api/dashboard/interactions?${queryParams.toString()}`;
      console.log('Fetching from URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error(`Error fetching interactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state with the response data - using safer null checks
      setAllInteractions(data?.interactions || []);
      setFilteredInteractions(data?.interactions || []);
      setStats(data?.stats || defaultStats);
      setDateRange(data?.dateRange || '');
      setTotalItems(data?.pagination?.total || 0);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
      // Set default values on error
      setAllInteractions([]);
      setFilteredInteractions([]);
      setStats(defaultStats);
      setDateRange('');
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Use debouncing for search term with proper dependencies handling
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only trigger if searchTerm has changed (and is defined)
      if (searchTerm !== undefined) {
        fetchInteractions({ searchTerm });
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]); // fetchInteractions removed from dependency array to prevent loops

  // Initial data load with error handling
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchInteractions({});
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };
    
    loadInitialData();
  }, []); // fetchInteractions removed from dependency array to prevent loops

  // Filter interactions based on provided criteria
  const filterInteractions = (filters: FilterOptions) => {
    setIsLoading(true);
    
    try {
      // For server-side filtering, we need to fetch with new parameters
      fetchInteractions({
        page: 1, // Reset to first page when applying new filters
        pageSize,
        startDate: filters.fromDate,
        endDate: filters.toDate,
        assistantId: filters.assistantId || assistantId || 'all',
        searchTerm
      });
    } catch (error) {
      console.error("Failed to apply filters:", error);
      setIsLoading(false);
    }
  };
  
  const value = {
    allInteractions,
    filteredInteractions,
    stats,
    dateRange,
    isLoading,
    setIsLoading,
    filterInteractions,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    fetchInteractions,
    assistantId,
    setAssistantId // Added new state value
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
