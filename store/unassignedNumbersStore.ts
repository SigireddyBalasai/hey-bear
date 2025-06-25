import { create } from "zustand";

interface UnassignedNumbersState {
  numbers: any[];
  isLoading: boolean;
  setNumbers: (numbers: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUnassignedNumbersStore = create<UnassignedNumbersState>(
  (set) => ({
    numbers: [],
    isLoading: true,
    setNumbers: (numbers) => set({ numbers }),
    setIsLoading: (isLoading) => set({ isLoading }),
  }),
);
