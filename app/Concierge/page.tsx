"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "./Header";
import { AssistantGrid } from "./AssistantGrid";
import { AssistantListWrapper } from "./AssistantListWrapper";
import { CreateAssistantDialog } from "./CreateAssistantDialog";
import { EmptyState } from "./EmptyState";
import { Loading } from "./Loading";
import { Login } from "./Login";
import { SearchAndControls } from "./SearchAndControl";
import { TabsNavigation } from "./TabsNavigation";
import { useAssistantManagement } from "./useAssistantManagement";
import { useUrlParameters } from "./useUrlParameters";

export default function AssistantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

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

  useUrlParameters({
    setFormData,
    setCreateDialogOpen,
    fetchAssistants: () => void fetchAssistants(),
  });

  useEffect(() => {
    void fetchAssistants();
  }, [fetchAssistants]);

  if (isLoading) return <Loading />;
  if (!user) return <Login />;

  const filteredAssistants = normalizedAssistants.filter(
    ({ assistant, config }) => {
      if (assistant.pending) return false;
      const matchesSearch =
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (config?.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ??
          false);

      if (selectedTab === "all") return matchesSearch;
      if (selectedTab === "favorites")
        return matchesSearch && assistant.is_starred;
      return matchesSearch;
    },
  );

  return (
    <div className="container space-y-6 py-6">
      <Header user={user} onCreateNew={() => setCreateDialogOpen(true)} />

      {normalizedAssistants.length === 0 ? (
        <EmptyState
          searchQuery=""
          onClearSearch={() => {}}
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
            <TabsNavigation
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
            />
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
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
