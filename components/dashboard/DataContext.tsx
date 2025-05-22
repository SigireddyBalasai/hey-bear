"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Create a type for the DataContext using built-in types only
type DataContextType = {
  dateRange: string;
  setDateRange: (range: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  setTotalPages: (total: number) => void;
  totalItems: number;
  setTotalItems: (total: number) => void;
  assistantId: string | null;
  setAssistantId: (id: string | null) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // Calculate default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Default date range (last 30 days)
  const defaultDateRange = `${formatDate(thirtyDaysAgo)} - ${formatDate(today)}`;
  
  // State variables
  const [dateRange, setDateRange] = useState<string>(defaultDateRange);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  
  // Context value
  const contextValue: DataContextType = {
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    setTotalPages,
    totalItems,
    setTotalItems,
    assistantId,
    setAssistantId
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  
  return context;
}
