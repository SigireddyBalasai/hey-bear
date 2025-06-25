import { create } from "zustand";

interface FilterStoreState {
  assistants: any[];
  isLoading: boolean;
  fromDate: string;
  toDate: string;
  setAssistants: (assistants: any[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setFromDate: (fromDate: string) => void;
  setToDate: (toDate: string) => void;
}

export const useFilterStore = create<FilterStoreState>((set) => ({
  assistants: [],
  isLoading: false,
  fromDate: "",
  toDate: "",
  setAssistants: (assistants) => set({ assistants }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setFromDate: (fromDate) => set({ fromDate }),
  setToDate: (toDate) => set({ toDate }),
}));
