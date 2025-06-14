'use client';

import React, { memo, useCallback, useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StatCardProps } from '@/types/consolidated-interfaces';

const StatValue = memo<{
  value: string | number;
  formatter?: (value: string | number) => string;
}>(({ value, formatter }) => {
  const formattedValue = useMemo(() => {
    if (formatter) {
      return formatter(value);
    }

    if (typeof value === 'number') {
      // Add comma formatting for large numbers
      return value.toLocaleString();
    }

    return value;
  }, [value, formatter]);

  return <div className="text-2xl font-bold text-foreground">{formattedValue}</div>;
});

StatValue.displayName = 'StatValue';

const StatTrend = memo<{
  trend: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}>(({ trend }) => {
  const trendColor = useMemo(
    () => (trend.isPositive ? 'text-green-600' : 'text-red-600'),
    [trend.isPositive]
  );

  const trendSymbol = useMemo(() => (trend.isPositive ? '↗' : '↘'), [trend.isPositive]);

  return (
    <div className={`flex items-center text-xs ${trendColor}`}>
      <span className="mr-1">{trendSymbol}</span>
      <span>
        {Math.abs(trend.value)}% {trend.label}
      </span>
    </div>
  );
});

StatTrend.displayName = 'StatTrend';

const LoadingSkeleton = memo(() => (
  <>
    <Skeleton className="h-8 w-24 mb-2" />
    <Skeleton className="h-3 w-full" />
  </>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const StatCard: React.FC<StatCardProps> = memo(
  ({ title, value, description, isLoading = false, icon, trend, formatter, className = '' }) => {
    // Memoize the card content to prevent unnecessary re-renders
    const cardContent = useMemo(() => {
      if (isLoading) {
        return <LoadingSkeleton />;
      }

      return (
        <>
          <StatValue value={value} formatter={formatter} />
          <CardDescription className="mt-1 text-xs">
            {description}
            {trend && (
              <>
                <br />
                <StatTrend trend={trend} />
              </>
            )}
          </CardDescription>
        </>
      );
    }, [isLoading, value, formatter, description, trend]);

    // Memoize header content
    const headerContent = useMemo(
      () => (
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
          {icon && <div className="flex-shrink-0">{icon}</div>}
        </div>
      ),
      [title, icon]
    );

    return (
      <Card className={className}>
        <CardHeader className="pb-2">{headerContent}</CardHeader>
        <CardContent>{cardContent}</CardContent>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

// Pre-configured stat card variants
export const UsageStatCard = memo<{
  title: string;
  current: number;
  total: number;
  isLoading?: boolean;
}>(({ title, current, total, isLoading = false }) => {
  const percentage = useMemo(
    () => (total > 0 ? Math.round((current / total) * 100) : 0),
    [current, total]
  );

  const formatter = useCallback(
    (_value: string | number) => `${current.toLocaleString()} / ${total.toLocaleString()}`,
    [current, total]
  );

  const trend = useMemo(
    () => ({
      value: percentage,
      label: 'usage',
      isPositive: percentage < 80, // Under 80% is considered good
    }),
    [percentage]
  );

  return (
    <StatCard
      title={title}
      value={percentage}
      description={`${percentage}% of limit used`}
      isLoading={isLoading}
      formatter={formatter}
      trend={trend}
    />
  );
});

UsageStatCard.displayName = 'UsageStatCard';

export const MetricStatCard = memo<{
  title: string;
  value: string | number;
  description: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  previousValue?: number;
  unit?: string;
}>(({ title, value, description, isLoading = false, icon, previousValue, unit = '' }) => {
  const numericValue = useMemo(
    () => (typeof value === 'string' ? parseFloat(value) || 0 : value),
    [value]
  );

  const trend = useMemo(() => {
    if (previousValue === undefined || previousValue === 0) return undefined;

    const change = ((numericValue - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change),
      label: 'vs last period',
      isPositive: change >= 0,
    };
  }, [numericValue, previousValue]);

  const formatter = useCallback(
    (val: string | number) => `${typeof val === 'number' ? val.toLocaleString() : val}${unit}`,
    [unit]
  );

  return (
    <StatCard
      title={title}
      value={value}
      description={description}
      isLoading={isLoading}
      icon={icon}
      trend={trend}
      formatter={formatter}
    />
  );
});

MetricStatCard.displayName = 'MetricStatCard';

export default StatCard;
