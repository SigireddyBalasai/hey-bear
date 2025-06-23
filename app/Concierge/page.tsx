'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';

import { AssistantGrid } from '@/components/concierge/AssistantGrid';
import { AssistantListWrapper } from '@/components/concierge/AssistantListWrapper';
import { CreateAssistantDialog } from '@/components/concierge/CreateAssistantDialog';
import { EmptyState } from '@/components/concierge/EmptyState';
import { Header } from '@/components/concierge/Header';
import { Loading } from '@/components/concierge/Loading';
import { Login } from '@/components/concierge/Login';
import { SearchAndControls } from '@/components/concierge/SearchAndControl';
import { TabsNavigation } from '@/components/concierge/TabsNavigation';
import { useAssistantManagement } from '@/hooks/useAssistantManagement';
import { useUrlParameters } from '@/hooks/useUrlParameters';

export default function AssistantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const {
    user,
    normalizedAssistants,
    isLoading,
    formData,
    setFormData,
    handleInputChange,
    handleDeleteAssistant,
    fetchAssistants,
  } = useAssistantManagement();

  // Handle URL parameters for Stripe redirects
  useUrlParameters({
    setFormData,
    setCreateDialogOpen,
    fetchAssistants: () => void fetchAssistants(),
  });

  // Fetch assistants on component mount
  useEffect(() => {
    void fetchAssistants();
  }, [fetchAssistants]);

  // Show loading screen while data is being fetched
  if (isLoading) {
    return <Loading />;
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Filter assistants based on search query and selected tab
  const filteredAssistants = normalizedAssistants.filter(assistantData => {
    const { assistant } = assistantData;
    const { config } = assistantData;

    // Check if the assistant has pending status - if so, exclude it
    const isPending = assistant.pending === true;

    if (isPending) return false;

    const matchesSearch =
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (config?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    // Filter based on selected tab
    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'favorites') return matchesSearch && assistant.is_starred === true;

    return matchesSearch;
  });

  return (
    <div className="container space-y-6 py-6">
      <Header user={user} onCreateNew={() => setCreateDialogOpen(true)} />

      {normalizedAssistants.length === 0 ? (
        <EmptyState
          searchQuery=""
          onClearSearch={() => {
            /* No search to clear when no assistants */
          }}
          onCreateNew={() => setCreateDialogOpen(true)}
          noAssistantsYet
        />
      ) : (
        <>
          <SearchAndControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onCreateNew={() => setCreateDialogOpen(true)}
          />

          <div className="flex items-center justify-between">
            <TabsNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <AssistantGrid
                assistants={filteredAssistants}
                searchQuery={searchQuery}
                selectedTab={selectedTab}
                viewMode="grid"
                onDeleteAssistant={handleDeleteAssistant}
              />
            ) : (
              <AssistantListWrapper
                assistants={filteredAssistants}
                searchQuery={searchQuery}
                selectedTab={selectedTab}
                onDeleteAssistant={handleDeleteAssistant}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <CreateAssistantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        formData={formData}
        onInputChange={handleInputChange}
      />
    </div>
  );
}
