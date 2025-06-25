import { create } from "zustand";

interface AdminSidebarState {
  userCount: number | null;
  isLoading: boolean;
  setUserCount: (count: number | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAdminSidebarStore = create<AdminSidebarState>((set) => ({
  userCount: null,
  isLoading: true,
  setUserCount: (userCount) => set({ userCount }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
