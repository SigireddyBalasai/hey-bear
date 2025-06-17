'use client';

import React from 'react';

import { motion } from 'framer-motion';

import type { AssistantWithNonNullableFields } from '@/types/concierge.types';

import { AssistantList } from './AssistantList';

interface AssistantListWrapperProps {
  assistants: AssistantWithNonNullableFields[];
  searchQuery: string;
  selectedTab: string;
  onDeleteAssistant: (assistantId: string) => void;
}

const filterAssistants = (
  assistants: AssistantWithNonNullableFields[],
  selectedTab: string,
  searchQuery: string
) => {
  return assistants.filter(assistant => {
    // Filter by tab
    if (selectedTab === 'starred' && !assistant.assistant.is_starred) return false;
    if (selectedTab === 'recent' && !assistant.last_interaction_at) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = assistant.assistant.name.toLowerCase().includes(query);
      const descMatch = assistant.config.description?.toLowerCase().includes(query) ?? false;
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
};

export function AssistantListWrapper({
  assistants,
  searchQuery,
  selectedTab,
  onDeleteAssistant,
}: AssistantListWrapperProps) {
  const filteredAssistants = filterAssistants(assistants, selectedTab, searchQuery);

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-2"
    >
      {filteredAssistants.map((assistantData, index) => (
        <motion.div
          key={assistantData.assistant.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <AssistantList
            assistant={{
              id: assistantData.assistant.id,
              name: assistantData.assistant.name || '',
              is_starred: assistantData.assistant.is_starred ?? false,
              created_at: assistantData.assistant.created_at,
              description: assistantData.config.description || '',
              has_phone_number: !!(
                assistantData.assistant.assigned_phone_number ??
                assistantData.config?.business_phone
              ),
              subscription_plan: 'personal' as 'personal' | 'business',
              total_messages: assistantData.interactions_count,
              last_used_at: assistantData.last_interaction_at || '',
            }}
            isLoading={false}
            isActionInProgress={false}
            onToggleStar={() => {
              // TODO: implement toggle star functionality
            }}
            onDelete={onDeleteAssistant}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
