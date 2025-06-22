'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';


import { AssistantSelection } from '@/components/dashboard/AssistantSelection';
import { DashboardControls } from '@/components/dashboard/DashboardControls';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSearch } from '@/components/dashboard/DashboardSearch';
import { useData } from '@/components/dashboard/DataContext';
import FilterComponent from '@/components/dashboard/FilterComponent';
import InteractionLog from '@/components/dashboard/InteractionLog';
import PlanUsage from '@/components/dashboard/PlanUsage';
import StatCard from '@/components/dashboard/StatCard';
import type { DashboardAssistant } from '@/types/assistant.types';
import { handleError } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

const ConciergeInteractionDashboard = () => {
  const searchParams = useSearchParams();
  const conciergeParam = searchParams.get('concierge');

  const {
    stats,
    dateRange,
    isLoading,
    setIsLoading,
    filterInteractions,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    totalPages: apiTotalPages,
    fetchInteractions,
    pageSize,
    assistantId,
    setAssistantId,
  } = useData();

  const [activeTab, setActiveTab] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [assistantName, setAssistantName] = useState('');
  const [availableAssistants, setAvailableAssistants] = useState<DashboardAssistant[]>([]);
  const [specificAssistant, setSpecificAssistant] = useState<DashboardAssistant | null>(null);

  const supabase = createClient();

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
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('name');

        if (!assistantsError && assistantsData) {
          setAvailableAssistants(assistantsData);

          // Handle concierge URL parameter
          if (conciergeParam) {
            // Try to find assistant by name first, then by ID
            let targetAssistant = assistantsData.find(
              (assistant: DashboardAssistant) =>
                assistant.name.toLowerCase() === conciergeParam.toLowerCase()
            );

            targetAssistant ??= assistantsData.find(
              (assistant: DashboardAssistant) => assistant.id === conciergeParam
            );

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

    void fetchUserData();
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
    void fetchInteractions({
      page: currentPage,
      pageSize,
      searchTerm,
      assistantId: assistantId ?? '', // Pass assistantId here
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

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    void filterInteractions({
      fromDate: startDate,
      toDate: endDate,
      assistantId: assistantId ?? '',
      searchTerm: '',
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    setSearchTerm(value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 p-4 md:p-8">
      <DashboardHeader
        specificAssistant={specificAssistant}
        assistantName={assistantName}
        dateRange={dateRange}
      />

      {!specificAssistant ? (
        <AssistantSelection />
      ) : (
        <>
          <DashboardControls
            dateRange={dateRange}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onDateRangeChange={handleDateRangeChange}
          />

          <DashboardSearch searchTerm={searchTerm} onSearchChange={handleSearch} />

          {showFilters && (
            <FilterComponent
              setShowFilters={setShowFilters}
              onClose={() => setShowFilters(false)}
              className=""
            />
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Interactions"
              value={stats.totalInteractions}
              description="Total messages or requests received by your No-show"
              isLoading={isLoading}
            />
            <StatCard
              title="Active Contacts"
              value={stats.activeContacts}
              description="Unique phone numbers that have interacted with your No-show"
              isLoading={isLoading}
            />
            <StatCard
              title="Interactions Per Contact"
              value={stats.interactionsPerContact.toFixed(1)}
              description="Average number of interactions per unique contact"
              isLoading={isLoading}
            />
            <StatCard
              title="Average Response Time"
              value={stats.averageResponseTime}
              description="Average time for your No-show to respond to a message"
              isLoading={isLoading}
            />
          </div>

          <PlanUsage
            selectedAssistant={specificAssistant?.id}
            assistantSelectionDisabled={Boolean(specificAssistant)}
          />

          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <InteractionLog
              interactions={[]}
              loading={isLoading}
              error={''}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              currentPage={currentPage}
              pageSize={10}
              totalPages={apiTotalPages}
              totalItems={apiTotalPages * 10}
              sortBy={'interaction_time'}
              sortDirection={'desc'}
              onSortChange={() => {
                // TODO: Implement sorting
              }}
              onPageChange={changePage}
              onTabChange={handleTabChange}
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
