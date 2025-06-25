import { create } from "zustand";

export interface RealTimeMonitorState {
  isMonitoring: boolean;
  stats: any[];
  alertsCount: number;
  lastUpdated: Date;
  currentTab: string;
  healthStatus: "healthy" | "warning" | "degraded";
  setIsMonitoring: (v: boolean) => void;
  setStats: (v: any[]) => void;
  setAlertsCount: (v: number) => void;
  setLastUpdated: (v: Date) => void;
  setCurrentTab: (v: string) => void;
  setHealthStatus: (v: "healthy" | "warning" | "degraded") => void;
}

export const useRealTimeMonitorStore = create<RealTimeMonitorState>((set) => ({
  isMonitoring: true,
  stats: [],
  alertsCount: 0,
  lastUpdated: new Date(),
  currentTab: "overview",
  healthStatus: "healthy",
  setIsMonitoring: (isMonitoring) => set({ isMonitoring }),
  setStats: (stats) => set({ stats }),
  setAlertsCount: (alertsCount) => set({ alertsCount }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  setCurrentTab: (currentTab) => set({ currentTab }),
  setHealthStatus: (healthStatus) => set({ healthStatus }),
}));
