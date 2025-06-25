import { create } from "zustand";

interface UserUsageTableState {
  searchTerm: string;
  sortField: string;
  sortDirection: "asc" | "desc";
  itemsPerPage: string;
  selectedUser: any; // Consider replacing 'any' with a proper user type
  setSelectedUser: (user: any) => void;
  detailModalOpen: boolean;
  setDetailModalOpen: (open: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSortField: (field: string) => void;
  setSortDirection: (dir: "asc" | "desc") => void;
  setItemsPerPage: (count: string) => void;
}

export const useUserUsageTableStore = create<UserUsageTableState>((set) => ({
  searchTerm: "",
  sortField: "assistant_name",
  sortDirection: "asc",
  itemsPerPage: "10",
  selectedUser: null,
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  detailModalOpen: false,
  setDetailModalOpen: (detailModalOpen) => set({ detailModalOpen }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSortField: (sortField) => set({ sortField }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
}));
