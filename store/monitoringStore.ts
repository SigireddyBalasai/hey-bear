import { create } from "zustand";

export interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage";
  lastIncident?: string;
  uptime: number;
  responseTime: number;
}

interface MonitoringState {
  user: any;
  setUser: (user: any) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  serviceStatuses: ServiceStatus[];
  setServiceStatuses: (statuses: ServiceStatus[]) => void;
  updateServiceStatuses: (
    updater: (prev: ServiceStatus[]) => ServiceStatus[],
  ) => void;
  systemLogs: string[];
  setSystemLogs: (logs: string[]) => void;
  updateSystemLogs: (updater: (prev: string[]) => string[]) => void;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  refreshInterval: 5000,
  setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
  serviceStatuses: [],
  setServiceStatuses: (serviceStatuses) => set({ serviceStatuses }),
  updateServiceStatuses: (updater) =>
    set((state) => ({ serviceStatuses: updater(state.serviceStatuses) })),
  systemLogs: [],
  setSystemLogs: (systemLogs) => set({ systemLogs }),
  updateSystemLogs: (updater) =>
    set((state) => ({ systemLogs: updater(state.systemLogs) })),
}));
