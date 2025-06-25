"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  MoreHorizontal,
  Search,
  ArrowUpDown,
  FileDown,
  Eye,
  UserRoundCog,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/lib/db.types";
import { Database } from "@/lib/db.types";
import { useUserUsageTableStore } from "@/store/userUsageTableStore";

type UserUsageData = Tables<"usage_overview"> & {
  users?: { id: string; email: string | null };
};

interface UserUsageTableProps {
  usageData: UserUsageData[];
}

export function UserUsageTable({ usageData }: UserUsageTableProps) {
  const {
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    itemsPerPage,
    setItemsPerPage,
  } = useUserUsageTableStore();

  // Memoized filtered and sorted data
  const filteredData = useMemo(() => {
    const filtered = usageData.filter((item) => {
      const email = item.users?.email || "";
      const name = item.assistant_name || "";
      return (
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";
      switch (sortField) {
        case "assistant_name":
          aValue = a.assistant_name || "";
          bValue = b.assistant_name || "";
          break;
        case "current_month_messages":
          aValue = a.current_month_messages || 0;
          bValue = b.current_month_messages || 0;
          break;
        case "current_month_tokens":
          aValue = a.current_month_tokens || 0;
          bValue = b.current_month_tokens || 0;
          break;
        default:
          aValue = a.assistant_name || "";
          bValue = b.assistant_name || "";
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
    return sorted.slice(0, parseInt(itemsPerPage, 10));
  }, [usageData, searchTerm, sortField, sortDirection]);

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortDirection("asc");
    }
    setSortField(field);
  };

  // Get initials
  const getInitials = (email: string = "") => {
    if (!email) return "U";
    return email[0].toUpperCase();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or assistants..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center justify-between sm:justify-end w-full sm:w-auto">
          <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="10 items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 items</SelectItem>
              <SelectItem value="20">20 items</SelectItem>
              <SelectItem value="50">50 items</SelectItem>
              <SelectItem value="100">100 items</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Sort By <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { label: "Assistant Name", value: "assistant_name" },
                { label: "Message Count", value: "current_month_messages" },
                { label: "Token Usage", value: "current_month_tokens" },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => handleSort(item.value)}
                  className="flex justify-between"
                >
                  {item.label}
                  {sortField === item.value && (
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User Email</TableHead>
              <TableHead>Assistant Name</TableHead>
              <TableHead className="text-right">Message Count</TableHead>
              <TableHead className="text-right">Token Usage</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <TableRow
                  key={item.assistant_id || idx}
                  className="hover:bg-muted/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src="" alt={item.users?.email || "User"} />
                        <AvatarFallback className="text-xs">
                          {getInitials(item.users?.email || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {item.users?.email || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.assistant_name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        (item.current_month_messages || 0) > 50
                          ? "default"
                          : "outline"
                      }
                      className="font-mono"
                    >
                      {item.current_month_messages || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(item.current_month_tokens || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <UserRoundCog className="h-4 w-4" /> Manage User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                          <FileDown className="h-4 w-4" /> Export Data
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 gap-2">
                          <AlertCircle className="h-4 w-4" /> Report Issue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>No results found</p>
                    <p className="text-sm">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{filteredData.length}</strong> of{" "}
            <strong>{usageData.length}</strong> entries
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
