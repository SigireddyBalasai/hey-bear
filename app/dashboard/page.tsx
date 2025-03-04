"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Calendar, Filter, ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import FilterComponent from './FilterComponent';
import StatCard from './StatCard';
import PlanUsage from './PlanUsage';
import InteractionLog from './InteractionLog';
import { useData } from './DataContext';
import logger from '@/lib/logger';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Create a logger with context
const pageLogger = logger.withContext('Dashboard');

const ConciergeInteractionDashboard = () => {
  pageLogger.debug('Rendering dashboard');
  
  const { 
    allInteractions, 
    stats, 
    dateRange, 
    isLoading, 
    setIsLoading,
    filterInteractions,
    totalPages: dataContextTotalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm
  } = useData();
  
  const [activeTab, setActiveTab] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Calculate default dates (1 month ago to today)
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Calculate pagination based on itemsPerPage
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, allInteractions.length);
  
  // Calculate total pages based on itemsPerPage
  const totalPages = Math.max(1, Math.ceil(allInteractions.length / itemsPerPage));

  // Log when interactions data changes
  useEffect(() => {
    pageLogger.debug(`Interactions updated: ${allInteractions.length} items`);
  }, [allInteractions]);
  
  // Reset to first page when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
    pageLogger.debug(`Items per page changed to ${itemsPerPage}`);
  }, [itemsPerPage, setCurrentPage]);

  // Function to change page - only affect the interactions section
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      pageLogger.debug(`Changing page to ${page}`);
      // Show loading only for the table/conversation section
      setIsLoading(true);
      setCurrentPage(page);
    }
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const result = [];
    
    // Always show first page
    result.push(1);
    
    // Current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!result.includes(i)) result.push(i);
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1 && !result.includes(totalPages)) {
      result.push(totalPages);
    }
    
    // Add ellipsis as needed
    const withEllipsis = [];
    for (let i = 0; i < result.length; i++) {
      if (i > 0 && result[i] - result[i-1] > 1) {
        withEllipsis.push('...');
      }
      withEllipsis.push(result[i]);
    }
    
    return withEllipsis;
  };

  // Handle date range change
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    pageLogger.debug('Date range changed', { startDate, endDate });
    filterInteractions({ fromDate: startDate, toDate: endDate });
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    pageLogger.debug(`Search term changed: "${value}"`);
    setSearchTerm(value);
  };

  // Track tab changes
  const handleTabChange = (tab: string) => {
    pageLogger.debug(`Tab changed to: ${tab}`);
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Top navigation button */}
      <div className="mb-6">
        <Link href="/assistants">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Assistants
          </Button>
        </Link>
      </div>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Syed's Concierge</h1>
          <p className="text-gray-500">555-555-1234</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold text-gray-800">Interaction Dashboard</h2>
          <p className="text-gray-500">{dateRange}</p>
        </div>
      </div>

      {/* Date Filter and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateRange}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium" htmlFor="start-date">Start Date</label>
                    <Input 
                      id="start-date" 
                      type="date" 
                      defaultValue={oneMonthAgo.toISOString().split('T')[0]} 
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="end-date">End Date</label>
                    <Input 
                      id="end-date" 
                      type="date" 
                      defaultValue={today.toISOString().split('T')[0]} 
                      className="mt-1" 
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const startDate = (document.getElementById('start-date') as HTMLInputElement).value;
                      const endDate = (document.getElementById('end-date') as HTMLInputElement).value;
                      handleDateRangeChange(startDate, endDate);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              pageLogger.debug(`Filter visibility toggle: ${!showFilters}`);
              setShowFilters(!showFilters);
            }}
            className={showFilters ? "bg-gray-100" : ""}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-8" 
            placeholder="Search interactions..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Filter Component */}
      {showFilters && <FilterComponent setShowFilters={setShowFilters} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Interactions" 
          value={stats.totalInteractions} 
          description="Total messages or requests received by your concierge"
          loading={false}
        />
        
        <StatCard 
          title="Active Contacts" 
          value={stats.activeContacts} 
          description="Unique phone numbers that have interacted with your concierge"
          loading={false}
        />
        
        <StatCard 
          title="Interactions Per Contact" 
          value={stats.interactionsPerContact.toFixed(1)} 
          description="Average interactions per unique contact"
          loading={false}
        />
        
        <StatCard 
          title="Average Response Time" 
          value={stats.averageResponseTime} 
          description="Average time for your concierge to respond to a message"
          loading={false}
        />
      </div>

      {/* Plan Usage Section */}
      <PlanUsage />

      {/* Interaction Log Section with pagination controls updated */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Table header with page size selector added */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTabChange('table')}
            >
              Table View
            </Button>
            <Button
              variant={activeTab === 'conversation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTabChange('conversation')}
            >
              Conversation View
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue placeholder="5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
        </div>
        
        <InteractionLog 
          isLoading={isLoading} 
          interactions={allInteractions} 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          startIndex={startIndex} 
          endIndex={endIndex} 
          allInteractions={allInteractions} 
          currentPage={currentPage} 
          totalPages={totalPages} 
          changePage={changePage} 
          getPaginationNumbers={getPaginationNumbers} 
        />
      </div>
    </div>
  );
};

export default ConciergeInteractionDashboard;