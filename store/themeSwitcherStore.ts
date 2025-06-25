import { create } from "zustand";

interface ThemeSwitcherState {
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
}

export const useThemeSwitcherStore = create<ThemeSwitcherState>((set) => ({
  mounted: false,
  setMounted: (mounted) => set({ mounted }),
}));
