"use client";

import { useState } from 'react';
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
  AlertCircle
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/lib/db.types";

// Use only database types directly without extra fields
type MonthlyUsageRow = Database['public']['Tables']['monthly_usage']['Row'];

// Extending UserRow to include all the needed fields that might come from joins
type UserRow = Database['public']['Tables']['users']['Row'] & {
  email?: string;
  full_name?: string;
};

interface UserUsageTableProps {
  usageData: Array<MonthlyUsageRow & { users?: UserRow }>;
}

export function UserUsageTable({ usageData = [] }: UserUsageTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState('10');
  // Add state for user details
  const [selectedUser, setSelectedUser] = useState<MonthlyUsageRow & { users?: UserRow } | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle viewing user details
  const handleViewDetails = (user: MonthlyUsageRow & { users?: UserRow }) => {
    setSelectedUser(user);
    // You could implement a modal or redirect here
    // For now, let's just log the user
    console.log('View details for user:', user);
  };

  // Filter and sort data with improved error handling
  const filteredData = usageData
    .filter(item => {
      // Guard against missing data
      if (!item) return false;
      
      const email = String(item.users?.email || '');
      const fullName = String(item.users?.full_name || '');
      
      return email.toLowerCase().includes(searchTerm.toLowerCase()) || 
             fullName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        // Use the new date_field if available, otherwise fallback to created_at
        const dateA = a?.date_field ? new Date(a.date_field).getTime() : 
                    (a?.created_at ? new Date(a.created_at).getTime() : 0);
        const dateB = b?.date_field ? new Date(b.date_field).getTime() : 
                    (b?.created_at ? new Date(b.created_at).getTime() : 0);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Rest of the sort function remains the same
      if (sortField === 'user') {
        const nameA = String(a.users?.full_name || '').toLowerCase();
        const nameB = String(b.users?.full_name || '').toLowerCase();
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      
      if (sortField === 'messages' || sortField === 'tokens' || sortField === 'cost') {
        const fieldMap: Record<string, keyof MonthlyUsageRow> = {
          'messages': 'interaction_count',
          'tokens': 'input_tokens', // Using input_tokens as base measure
          'cost': 'total_cost'
        };
        
        const field = fieldMap[sortField];
        const valueA = Number(a?.[field] || 0);
        const valueB = Number(b?.[field] || 0);
        
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    })
    .slice(0, parseInt(itemsPerPage, 10));
  
  // Get initials with error handling
  const getInitials = (name: string = '') => {
    if (!name) return 'UN';
    
    return name
      .split(' ')
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'UN';
  };

  // Format date safely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return {
      short: 'N/A',
      year: ''
    };
    
    try {
      const date = new Date(dateStr);
      return {
        short: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        year: date.toLocaleDateString('en-US', { year: 'numeric' })
      };
    } catch (e) {
      return { short: 'Invalid date', year: '' };
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
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
              <DropdownMenuItem onClick={() => handleSort('date')} className="flex justify-between">
                Date 
                {sortField === 'date' && <ArrowUpDown className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('user')} className="flex justify-between">
                User Name
                {sortField === 'user' && <ArrowUpDown className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('messages')} className="flex justify-between">
                Message Count
                {sortField === 'messages' && <ArrowUpDown className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('tokens')} className="flex justify-between">
                Token Usage
                {sortField === 'tokens' && <ArrowUpDown className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('cost')} className="flex justify-between">
                Cost
                {sortField === 'cost' && <ArrowUpDown className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Message Count</TableHead>
              <TableHead className="text-right">Token Usage</TableHead>
              <TableHead className="text-right">Cost Estimate</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                // Handle null date_field by providing undefined instead
                const dateFormatted = formatDate(item?.date_field ?? undefined);
                return (
                <TableRow key={item?.id || Math.random().toString()} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src="" alt={item.users?.full_name || "User"} />
                        <AvatarFallback className="text-xs">
                          {getInitials(item.users?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{item.users?.full_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{item.users?.email || "No email"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{dateFormatted.short}</span>
                      <span className="text-xs text-muted-foreground">{dateFormatted.year}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={Number(item?.interaction_count || 0) > 50 ? "default" : "outline"} className="font-mono">
                      {item?.interaction_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {((Number(item?.input_tokens || 0) + Number(item?.output_tokens || 0))).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={Number(item?.total_cost || 0) > 1 ? "text-amber-600 font-semibold" : ""}>
                      ${Number(item?.total_cost || 0).toFixed(2)}
                    </span>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(item)} className="gap-2">
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
              )})
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>No results found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
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
            Showing <strong>{filteredData.length}</strong> of <strong>{usageData.length}</strong> entries
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
