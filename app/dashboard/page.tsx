'use client';

import React, { Suspense, useEffect, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { ArrowLeft, Calendar, Filter, Search } from 'lucide-react';

import { AssistantSelection } from '@/components/dashboard/AssistantSelection';
import { useData } from '@/components/dashboard/DataContext';
import FilterComponent from '@/components/dashboard/FilterComponent';
import InteractionLog from '@/components/dashboard/InteractionLog';
import PlanUsage from '@/components/dashboard/PlanUsage';
import StatCard from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DashboardAssistant } from '@/types/assistant.types';
import { handleError } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

const ConciergeInteractionDashboard = () => {
  const searchParams = useSearchParams();
  const conciergeParam = searchParams.get('concierge');

  const {
    allInteractions: _allInteractions, // Not used directly, InteractionLog fetches its own data
    stats,
    dateRange,
    isLoading,
    setIsLoading,
    filterInteractions,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    totalItems: _totalItems,
    totalPages: apiTotalPages,
    fetchInteractions,
    pageSize,
    setPageSize,
    assistantId,
    setAssistantId,
  } = useData();

  const [activeTab, setActiveTab] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [assistantName, setAssistantName] = useState('');
  const [availableAssistants, setAvailableAssistants] = useState<DashboardAssistant[]>([]);
  const [specificAssistant, setSpecificAssistant] = useState<DashboardAssistant | null>(null);

  const supabase = createClient();

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.error('Error fetching user:', error);
          return;
        }

        // Fetch all available assistants for the user
        const { data: assistantsData, error: assistantsError } = await supabase
          .from('assistants')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');

        if (!assistantsError && assistantsData) {
          setAvailableAssistants(assistantsData);

          // Handle concierge URL parameter
          if (conciergeParam) {
            // Try to find assistant by name first, then by ID
            let targetAssistant = assistantsData.find(
              assistant => assistant.name.toLowerCase() === conciergeParam.toLowerCase()
            );

            if (!targetAssistant) {
              targetAssistant = assistantsData.find(assistant => assistant.id === conciergeParam);
            }

            if (targetAssistant) {
              setSpecificAssistant(targetAssistant);
              setAssistantId(targetAssistant.id);
              setAssistantName(targetAssistant.name);
            } else {
              console.warn(`Assistant not found: ${conciergeParam}`);
              handleError(new Error(`Assistant "${conciergeParam}" not found`), {
                toastTitle: 'Assistant not found',
                fallbackMessage: 'The specified assistant could not be found.',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        handleError(error as Error, {
          toastTitle: 'Failed to load user data',
          fallbackMessage: 'There was an error loading your information.',
        });
      }
    };

    fetchUserData();
  }, [supabase, conciergeParam, setAssistantId]);

  // Update assistant name when assistantId changes
  useEffect(() => {
    if (assistantId && availableAssistants.length > 0) {
      const assistant = availableAssistants.find(a => a.id === assistantId);
      if (assistant) {
        setAssistantName(assistant.name);
      }
    }
  }, [assistantId, availableAssistants]);

  // Using API pagination instead of client-side pagination
  useEffect(() => {
    fetchInteractions({
      page: currentPage,
      pageSize: pageSize,
      searchTerm: searchTerm,
      assistantId: assistantId ?? undefined, // Pass assistantId here
    });
  }, [currentPage, pageSize, searchTerm, assistantId, fetchInteractions]);

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

  const _getPaginationNumbers = () => {
    const result = [];

    result.push(1);

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(apiTotalPages - 1, currentPage + 1);
      i++
    ) {
      if (!result.includes(i)) result.push(i);
    }

    if (apiTotalPages > 1 && !result.includes(apiTotalPages)) {
      result.push(apiTotalPages);
    }

    const withEllipsis = [];
    for (let i = 0; i < result.length; i++) {
      if (i > 0 && result[i] - result[i - 1] > 1) {
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
    <div className="flex min-h-screen flex-col bg-gray-50 p-4 md:p-8">
      <div className="mb-6">
        <Link href="/Concierge">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            My No-shows
          </Button>
        </Link>
      </div>

      {!specificAssistant ? (
        <AssistantSelection />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-end">
            <div className="text-right">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                Dashboard - {specificAssistant.name}
                <Badge variant="outline">{specificAssistant.name}</Badge>
              </h2>
              <p className="text-gray-500">
                Analytics for {assistantName} • {dateRange}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {dateRange}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium" htmlFor="start-date">
                          Start Date
                        </label>
                        <Input
                          id="start-date"
                          type="date"
                          defaultValue={oneMonthAgo.toISOString().split('T')[0]}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium" htmlFor="end-date">
                          End Date
                        </label>
                        <Input
                          id="end-date"
                          type="date"
                          defaultValue={today.toISOString().split('T')[0]}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const startDate = (
                            document.querySelector('#start-date') as HTMLInputElement
                          ).value;
                          const endDate = (document.querySelector('#end-date') as HTMLInputElement)
                            .value;
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
                className={showFilters ? 'bg-gray-100' : ''}
              >
                <Filter className="mr-1 h-4 w-4" />
                Filters
              </Button>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                className="pl-8"
                placeholder="Search interactions..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          {showFilters && <FilterComponent setShowFilters={setShowFilters} />}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Interactions"
              value={stats.totalInteractions}
              description="Total messages or requests received by your No-show"
              isLoading={isLoading} // Changed from loading
            />

            <StatCard
              title="Active Contacts"
              value={stats.activeContacts}
              description="Unique phone numbers that have interacted with your No-show"
              isLoading={isLoading} // Changed from loading
            />

            <StatCard
              title="Interactions Per Contact"
              value={stats.interactionsPerContact.toFixed(1)}
              description="Average number of interactions per unique contact"
              isLoading={isLoading} // Changed from loading
            />

            <StatCard
              title="Average Response Time"
              value={stats.averageResponseTime}
              description="Average time for your No-show to respond to a message"
              isLoading={isLoading} // Changed from loading
            />
          </div>

          <PlanUsage
            selectedAssistant={specificAssistant?.id}
            assistantSelectionDisabled={!!specificAssistant}
          />

          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleTabChange('table');
                  }}
                >
                  Table View
                </Button>
                <Button
                  variant={activeTab === 'conversation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleTabChange('conversation');
                  }}
                >
                  Conversation View
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show:</span>
                <Select value={pageSize.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="h-8 w-[80px]">
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
              loading={isLoading}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              currentPage={currentPage}
              totalPages={apiTotalPages}
              onPageChange={changePage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <ConciergeInteractionDashboard />
    </Suspense>
  );
}
