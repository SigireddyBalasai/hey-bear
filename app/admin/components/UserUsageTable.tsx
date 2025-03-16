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
import { UserDetailModal } from './UserDetailModal';
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

interface UserUsageTableProps {
  usageData: any[];
}

export function UserUsageTable({ usageData }: UserUsageTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState('10');

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredData = usageData
    .filter(item => {
      // Guard against missing data
      if (!item.users) return false;
      
      const email = item.users?.email || '';
      const fullName = item.users?.full_name || '';
      
      return email.toLowerCase().includes(searchTerm.toLowerCase()) || 
             fullName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortField === 'user') {
        const nameA = a.users?.full_name?.toLowerCase() || '';
        const nameB = b.users?.full_name?.toLowerCase() || '';
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      
      if (sortField === 'messages' || sortField === 'tokens' || sortField === 'cost') {
        const fieldMap: Record<string, string> = {
          'messages': 'message_count',
          'tokens': 'token_usage',
          'cost': 'cost_estimate'
        };
        
        const valueA = a[fieldMap[sortField]] || 0;
        const valueB = b[fieldMap[sortField]] || 0;
        
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return 0;
    })
    .slice(0, parseInt(itemsPerPage, 10));

  // View user details
  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };
  
  // Get initials
  const getInitials = (name: string = '') => {
    if (!name) return 'UN';
    
    return name
      .split(' ')
      .map(part => part[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'UN';
  };

  // Format date safely
  const formatDate = (dateStr: string) => {
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
                const dateFormatted = formatDate(item.date);
                return (
                <TableRow key={item.id} className="hover:bg-muted/30">
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
                    <Badge variant={item.message_count > 50 ? "default" : "outline"} className="font-mono">
                      {item.message_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(item.token_usage || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={item.cost_estimate > 1 ? "text-amber-600 font-semibold" : ""}>
                      ${item.cost_estimate?.toFixed(2) || "0.00"}
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
      
      <UserDetailModal 
        isOpen={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        userData={selectedUser} 
      />
    </div>
  );
}
