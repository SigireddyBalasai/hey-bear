import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { AssistantSelectorProps } from '@/types/dashboard.types';

/**
 * Component for selecting an assistant from a dropdown
 */
export const AssistantSelector: React.FC<AssistantSelectorProps> = ({
  assistants,
  selectedAssistant,
  onAssistantChange,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="w-[200px]">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    );
  }

  if (assistants.length === 0) {
    return <span className="text-sm text-muted-foreground">No assistants available</span>;
  }

  return (
    <Select value={selectedAssistant} onValueChange={onAssistantChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select Assistant" />
      </SelectTrigger>
      <SelectContent>
        {assistants.map(assistant => (
          <SelectItem key={assistant.id} value={assistant.id}>
            {assistant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
