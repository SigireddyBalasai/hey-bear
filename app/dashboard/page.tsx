"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Calendar, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import FilterComponent from './FilterComponent';
import StatCard from './StatCard';
import PlanUsage from './PlanUsage';
import InteractionLog from './InteractionLog';
import { useData } from './DataContext';
import { createClient } from '@/utils/supabase/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ConciergeInteractionDashboard = () => {
  const { 
    allInteractions, 
    stats, 
    dateRange, 
    isLoading, 
    setIsLoading,
    filterInteractions,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    totalItems,
    totalPages: apiTotalPages,
    fetchInteractions,
    pageSize,
    setPageSize,
    assistantId
  } = useData();
  
  const [activeTab, setActiveTab] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [userName, setUserName] = useState('');
  const [assistantName, setAssistantName] = useState('');
  
  const supabase = createClient();
  
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      
      if (user) {
        // Use the user's name from their profile data - could be from Google login
        if (user.user_metadata && user.user_metadata.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.user_metadata && user.user_metadata.name) {
          setUserName(user.user_metadata.name);
        } else {
          setUserName('User');
        }
        
        // If assistantId is available, fetch the assistant's name
        if (assistantId) {
          const { data, error } = await supabase
            .from('assistants')
            .select('name')
            .eq('id', assistantId)
            .single();
            
          if (data && !error) {
            setAssistantName(data.name);
          }
        }
      }
    };
    
    fetchUserData();
  }, [supabase, assistantId]);

  // Using API pagination instead of client-side pagination
  useEffect(() => {
    fetchInteractions({
      page: currentPage,
      pageSize: pageSize,
      searchTerm: searchTerm,
      assistantId: assistantId || undefined // Pass assistantId here
    });
  }, [currentPage, pageSize, searchTerm, assistantId]);
  
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when changing page size
  }, [pageSize, setCurrentPage]);

  const changePage = (page: number) => {
    if (page >= 1 && page <= apiTotalPages) {
      setIsLoading(true);
      setCurrentPage(page);
    }
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setPageSize(Number(value));
  };

  const getPaginationNumbers = () => {
    const result = [];
    
    result.push(1);
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(apiTotalPages - 1, currentPage + 1); i++) {
      if (!result.includes(i)) result.push(i);
    }
    
    if (apiTotalPages > 1 && !result.includes(apiTotalPages)) {
      result.push(apiTotalPages);
    }
    
    const withEllipsis = [];
    for (let i = 0; i < result.length; i++) {
      if (i > 0 && result[i] - result[i-1] > 1) {
        withEllipsis.push('...');
      }
      withEllipsis.push(result[i]);
    }
    
    return withEllipsis;
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    filterInteractions({ fromDate: startDate, toDate: endDate });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6">
        <Link href="/Concierge">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Concierge
          </Button>
        </Link>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userName ? `${userName}'s${assistantName ? ` ${assistantName}` : ' Concierge'}` : 'My Concierge'}
          </h1>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold text-gray-800">Interaction Dashboard</h2>
          <p className="text-gray-500">{dateRange}</p>
        </div>
      </div>

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
      {showFilters && <FilterComponent setShowFilters={setShowFilters} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Interactions" 
          value={stats.totalInteractions} 
          description="Total messages or requests received by your Concierge"
          loading={isLoading}
        />
        
        <StatCard 
          title="Active Contacts" 
          value={stats.activeContacts} 
          description="Unique phone numbers that have interacted with your Concierge"
          loading={isLoading}
        />
        
        <StatCard 
          title="Interactions Per Contact" 
          value={stats.interactionsPerContact.toFixed(1)} 
          description="Average interactions per unique contact"
          loading={isLoading}
        />
        
        <StatCard 
          title="Average Response Time" 
          value={stats.averageResponseTime} 
          description="Average time for your Concierge to respond to a message"
          loading={isLoading}
        />
      </div>

      <PlanUsage />

      <div className="bg-white rounded-lg shadow p-4 mb-6">
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
              value={pageSize.toString()} 
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
          startIndex={0} // Not needed with API pagination
          endIndex={allInteractions.length} // Not needed with API pagination
          allInteractions={allInteractions} 
          currentPage={currentPage} 
          totalPages={apiTotalPages} 
          changePage={changePage} 
          getPaginationNumbers={getPaginationNumbers} 
        />
      </div>
    </div>
  );
};

export default ConciergeInteractionDashboard;
