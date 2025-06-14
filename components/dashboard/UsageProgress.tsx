import React from 'react';

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { UsageProgressProps } from '@/types/consolidated-interfaces';

/**
 * A reusable component for showing usage metrics with progress bar
 */
export const UsageProgress: React.FC<UsageProgressProps> = ({
  title,
  metric,
  isLoading = false,
  dangerThreshold = 80,
}) => {
  const showDanger = metric?.percentage && metric.percentage > dangerThreshold;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{title}</span>
        {isLoading ? (
          <Skeleton className="h-4 w-12" />
        ) : (
          <span className="font-medium">
            {metric?.used || 0}/{metric?.total || 0}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-2 w-full" />
      ) : (
        <Progress
          value={metric?.percentage || 0}
          className={`h-2 ${showDanger ? 'bg-red-500' : ''}`}
        />
      )}
    </div>
  );
};
