import { create } from "zustand";

interface AdminDashboardState {
  user: any;
  isAdmin: boolean;
  isLoading: boolean;
  dashboardData: any;
  selectedTimeRange: string;
  timeSeriesData: any[];
  setTimeSeriesData: (data: any[]) => void;
  totalStats: any;
  setTotalStats: (stats: any) => void;
  userStats: any[];
  setUserStats: (stats: any[]) => void;
  setUser: (user: any) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setDashboardData: (data: any) => void;
  setSelectedTimeRange: (range: string) => void;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  dashboardData: null,
  selectedTimeRange: "30d",
  timeSeriesData: [],
  setTimeSeriesData: (timeSeriesData) => set({ timeSeriesData }),
  totalStats: null,
  setTotalStats: (totalStats) => set({ totalStats }),
  userStats: [],
  setUserStats: (userStats) => set({ userStats }),
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setDashboardData: (dashboardData) => set({ dashboardData }),
  setSelectedTimeRange: (selectedTimeRange) => set({ selectedTimeRange }),
}));
