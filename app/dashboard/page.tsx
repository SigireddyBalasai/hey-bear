"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Calendar, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import FilterComponent from '@/components/dashboard/FilterComponent';
import StatCard from '@/components/dashboard/StatCard';
import PlanUsage from '@/components/dashboard/PlanUsage';
import InteractionLog from '@/components/dashboard/InteractionLog';
import { useData } from '@/components/dashboard/DataContext';
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
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    assistantId,
    setAssistantId
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
      // Get user metadata if available
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } else {
        setUserName('User');
      }
      
      // If assistantId is available, fetch the assistant's name
      if (assistantId) {
        const { data, error } = await supabase
          .schema('assistants')
          .from('assistants')
          .select('name')
          .eq('id', assistantId)
          .single();
          
        if (data && !error) {
          setAssistantName(data.name);
        }
      }
    };
    
    fetchUserData();
  }, [supabase, assistantId]);
  
  useEffect(() => {
    const currentDate = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    setDateRange(`${formatDate(lastMonth)} - ${formatDate(currentDate)}`);
  }, [setDateRange]);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      };
      
      setDateRange(`${formatDate(start)} - ${formatDate(end)}`);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing page size
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6">
        <Link href="/Concierge">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            My No-shows
          </Button>
        </Link>
      </div>
      <div className="flex justify-end items-center mb-6">
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
          metricType="totalInteractions"
          description="Total messages or requests received by your No-show"
        />
        
        <StatCard 
          title="Active Contacts" 
          metricType="activeContacts"
          description="Unique phone numbers that have interacted with your No-show"
        />
        
        <StatCard 
          title="Interactions Per Contact" 
          metricType="interactionsPerContact"
          description="Average number of interactions per unique contact"
        />
        
        <StatCard 
          title="Average Response Time" 
          metricType="averageResponseTime"
          description="Average time for your No-show to respond to a message"
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
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
        />
      </div>
    </div>
  );
};

export default ConciergeInteractionDashboard;
