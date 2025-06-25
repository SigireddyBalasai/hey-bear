"use client";
import { createContext, useContext } from "react";
import { useDataStore } from "@/store/dataStore";
import { Interaction, DashboardStats } from "./models";

const DataContext = createContext<any>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useDataStore();
  return <DataContext.Provider value={store}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
