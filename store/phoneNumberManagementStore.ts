import { create } from "zustand";

interface PhoneNumberManagementState {
  assignedNumbers: any[];
  assistants: any[];
  isLoading: boolean;
  newPhoneNumber: string;
  areaCode: string;
  isAssigning: boolean;
  selectedCountry: string;
  selectedAssistantForCountry: string;
  setAssignedNumbers: (numbers: any[]) => void;
  setAssistants: (assistants: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  setNewPhoneNumber: (num: string) => void;
  setAreaCode: (code: string) => void;
  setIsAssigning: (assigning: boolean) => void;
  setSelectedCountry: (country: string) => void;
  setSelectedAssistantForCountry: (assistant: string) => void;
}

export const usePhoneNumberManagementStore = create<PhoneNumberManagementState>(
  (set) => ({
    assignedNumbers: [],
    assistants: [],
    isLoading: true,
    newPhoneNumber: "",
    areaCode: "",
    isAssigning: false,
    selectedCountry: "US",
    selectedAssistantForCountry: "",
    setAssignedNumbers: (assignedNumbers) => set({ assignedNumbers }),
    setAssistants: (assistants) => set({ assistants }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setNewPhoneNumber: (newPhoneNumber) => set({ newPhoneNumber }),
    setAreaCode: (areaCode) => set({ areaCode }),
    setIsAssigning: (isAssigning) => set({ isAssigning }),
    setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
    setSelectedAssistantForCountry: (selectedAssistantForCountry) =>
      set({ selectedAssistantForCountry }),
  }),
);
