import { create } from "zustand";

type Step = "details" | "payment";

interface CreateAssistantState {
  sessionId: string | null;
  currentStep: Step;
  userId: string;
  isSavingSession: boolean;
  setSessionId: (id: string | null) => void;
  setCurrentStep: (step: Step) => void;
  setUserId: (id: string) => void;
  setIsSavingSession: (saving: boolean) => void;
  reset: () => void;
}

export const useCreateAssistantStore = create<CreateAssistantState>((set) => ({
  sessionId: null,
  currentStep: "details",
  userId: "",
  isSavingSession: false,
  setSessionId: (sessionId) => set({ sessionId }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setUserId: (userId) => set({ userId }),
  setIsSavingSession: (isSavingSession) => set({ isSavingSession }),
  reset: () =>
    set({
      sessionId: null,
      currentStep: "details",
      userId: "",
      isSavingSession: false,
    }),
}));
