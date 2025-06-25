import { create } from "zustand";

interface DashboardUiState {
  activeTab: string;
  showFilters: boolean;
  userName: string;
  assistantName: string;
  setActiveTab: (tab: string) => void;
  setShowFilters: (show: boolean) => void;
  setUserName: (name: string) => void;
  setAssistantName: (name: string) => void;
}

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  activeTab: "table",
  showFilters: false,
  userName: "",
  assistantName: "",
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowFilters: (showFilters) => set({ showFilters }),
  setUserName: (userName) => set({ userName }),
  setAssistantName: (assistantName) => set({ assistantName }),
}));
