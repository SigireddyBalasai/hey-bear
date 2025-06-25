import { create } from "zustand";

interface PhoneManagementState {
  user: any;
  isAdmin: boolean;
  isLoading: boolean;
  twilioConfigured: boolean;
  activeTab: string;
  isSettingsLoading: boolean;
  setUser: (user: any) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setTwilioConfigured: (twilioConfigured: boolean) => void;
  setActiveTab: (activeTab: string) => void;
  setIsSettingsLoading: (isSettingsLoading: boolean) => void;
}

export const usePhoneManagementStore = create<PhoneManagementState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: true,
  twilioConfigured: true,
  activeTab: "manage",
  isSettingsLoading: true,
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setTwilioConfigured: (twilioConfigured) => set({ twilioConfigured }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsSettingsLoading: (isSettingsLoading) => set({ isSettingsLoading }),
}));
