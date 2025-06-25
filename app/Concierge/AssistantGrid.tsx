"use client";

import { motion } from "framer-motion";
import { AssistantWithNonNullableFields } from "@/types/AssistantWithNonNullableFields";
import type { ConciergeAssistantGridProps } from "@/types/ConciergeAssistantGridProps";

import { AssistantCard } from "./conciergeCard";

const filterAssistants = (
  assistants: AssistantWithNonNullableFields[],
  selectedTab: string,
  searchQuery: string,
) =>
  assistants.filter((assistant) => {
    // Filter by tab
    if (selectedTab === "starred" && !assistant.assistant.is_starred)
      return false;
    if (selectedTab === "recent" && !assistant.activity?.last_used_at)
      return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = assistant.assistant.name.toLowerCase();
      const description = assistant.config?.description?.toLowerCase() ?? "";

      return name.includes(query) || description.includes(query);
    }

    return true;
  });

export function AssistantGrid({
  assistants,
  searchQuery,
  selectedTab,
  viewMode,
  onDeleteAssistant,
}: ConciergeAssistantGridProps) {
  const filteredAssistants = filterAssistants(
    assistants,
    selectedTab,
    searchQuery,
  );

  if (filteredAssistants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {searchQuery
            ? `No assistants found matching "${searchQuery}"`
            : selectedTab === "starred"
              ? "No starred assistants yet"
              : selectedTab === "recent"
                ? "No recent activity"
                : "No assistants found"}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={`gap-6 ${
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col space-y-4"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {filteredAssistants.map((assistant, index) => (
        <motion.div
          key={assistant.assistant.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <AssistantCard
            assistant={{
              id: assistant.assistant.id,
              name: assistant.assistant.name ?? "",
              is_starred: assistant.assistant.is_starred ?? false,
              created_at: assistant.assistant.created_at,
              assigned_phone_number: assistant.assistant.assigned_phone_number,
              description: assistant.config.description,
              total_messages: assistant.activity?.total_messages ?? 0,
              last_used_at: assistant.activity?.last_used_at ?? null,
              plan_name: assistant.subscription?.plan_name ?? null,
            }}
            isLoading={false}
            isActionInProgress={false}
            onToggleStar={() => {
              // TODO: implement toggle star functionality
            }}
            onDelete={onDeleteAssistant}
            onDeleteAssistant={onDeleteAssistant}
            onUpgrade={() => {
              // TODO: Implement upgrade functionality
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
