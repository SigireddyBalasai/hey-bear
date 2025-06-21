'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { UsageDisplayProps } from '@/types/dashboard.types';

/**
 * A flexible component for displaying usage metrics
 * Can be displayed inline or in a card, and works with different usage data formats
 */
const UsageDisplayComponent: React.FC<UsageDisplayProps> = ({
  title,
  usage,
  variant = 'inline',
  isLoading = false,
  dangerThreshold = 80,
  description,
  icon,
  className = '',
}) => {
  // Helper to get the current usage value from either UsageMetric or UsageData
  const getCurrentValue = () => {
    if (!usage) return 0;
    // Check if it's UsageMetric (has 'used' property)
    if ('used' in usage) return usage.used;

    // Otherwise assume it's UsageData (has 'current' property)
    return usage.current;
  };

  // Helper to get the limit/total value from either UsageMetric or UsageData
  const getTotalValue = () => {
    if (!usage) return 0;
    // Check if it's UsageMetric (has 'total' property)
    if ('total' in usage) return usage.total;

    // Otherwise assume it's UsageData (has 'limit' property)
    return usage.limit;
  };

  // Function to get appropriate color class based on percentage
  const getColorClass = () => {
    if (!usage) return '';
    const { percentage } = usage;

    if (percentage >= dangerThreshold) return 'bg-red-500';
    if (percentage >= dangerThreshold * 0.8) return 'bg-amber-500';

    return '';
  };

  // Loading skeleton for the usage metric
  const loadingSkeleton = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
  );

  // Empty state for when no data is available
  const emptyState = (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>0 / 0</span>
        <span className="text-muted-foreground">0%</span>
      </div>
      <Progress value={0} className="h-2" />
      <div className="text-xs text-muted-foreground">No data available</div>
    </div>
  );

  // The content to display when data is available
  const dataContent = usage ? (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {getCurrentValue().toLocaleString()} / {getTotalValue().toLocaleString()}
        </span>
        <span className="text-muted-foreground">{usage.percentage}%</span>
      </div>
      <Progress value={usage.percentage} className={`h-2 ${getColorClass()}`} />
    </div>
  ) : (
    emptyState
  );

  // The content to display based on loading state
  const content = (
    <div className={`space-y-2 ${className}`}>
      {variant === 'inline' && <span className="text-sm">{title}</span>}
      {isLoading ? loadingSkeleton : dataContent}
    </div>
  );

  // If inline variant, just return the content
  if (variant === 'inline') {
    return <div>{content}</div>;
  }

  // If card variant, wrap in a Card component
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          {icon && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-2">{content}</CardContent>
    </Card>
  );
};

export { UsageDisplayComponent as UsageDisplay };
