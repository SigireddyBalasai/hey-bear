import { create } from "zustand";
import { DashboardStats } from "@/app/dashboard/models";
import { Interaction } from "@/app/dashboard/models";

interface FilterOptions {
  fromDate?: string;
  toDate?: string;
  assistantId?: string;
  messageType?: string;
}

interface FetchOptions {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  assistantId?: string;
  searchTerm?: string;
}

interface DataStoreState {
  allInteractions: Interaction[];
  filteredInteractions: Interaction[];
  stats: DashboardStats;
  dateRange: string;
  isLoading: boolean;
  searchTerm: string;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  assistantId: string | null;
  setAllInteractions: (all: Interaction[]) => void;
  setFilteredInteractions: (filtered: Interaction[]) => void;
  setStats: (stats: DashboardStats) => void;
  setDateRange: (range: string) => void;
  setIsLoading: (loading: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (count: number) => void;
  setTotalPages: (count: number) => void;
  setAssistantId: (id: string | null) => void;
}

export const useDataStore = create<DataStoreState>((set) => ({
  allInteractions: [],
  filteredInteractions: [],
  stats: {
    totalInteractions: 0,
    activeContacts: 0,
    interactionsPerContact: 0,
    averageResponseTime: "0s",
    phoneNumbers: "0/10",
    smsReceived: "0/200",
    smsSent: "0/200",
    planType: "Personal",
  },
  dateRange: "",
  isLoading: false,
  searchTerm: "",
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  assistantId: null,
  setAllInteractions: (all) => set({ allInteractions: all }),
  setFilteredInteractions: (filtered) =>
    set({ filteredInteractions: filtered }),
  setStats: (stats) => set({ stats }),
  setDateRange: (dateRange) => set({ dateRange }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setPageSize: (pageSize) => set({ pageSize }),
  setTotalItems: (totalItems) => set({ totalItems }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setAssistantId: (assistantId) => set({ assistantId }),
}));
