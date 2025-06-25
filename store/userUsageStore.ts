import { create } from "zustand";

interface UserUsageState {
  user: any;
  isAdmin: boolean;
  isLoading: boolean;
  usageData: any[];
  searchTerm: string;
  dateRange: { from: Date; to: Date };
  setUser: (user: any) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setUsageData: (data: any[]) => void;
  setSearchTerm: (term: string) => void;
  setDateRange: (range: { from: Date; to: Date }) => void;
}

export const useUserUsageStore = create<UserUsageState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  usageData: [],
  searchTerm: "",
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setUsageData: (usageData) => set({ usageData }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setDateRange: (dateRange) => set({ dateRange }),
}));
