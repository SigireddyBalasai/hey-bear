'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback components
export const InteractionLogSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 border rounded">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-full" />
    </CardContent>
  </Card>
);

export const PlanUsageSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = 'Component',
}) => (
  <Alert variant="destructive" className="my-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error in {componentName}</AlertTitle>
    <AlertDescription className="mt-2">
      <div className="space-y-2">
        <p>{error.message || 'An unexpected error occurred'}</p>
        <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

// Suspense wrapper with error boundary
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  componentName?: string;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  componentName = 'Component',
}) => (
  <ErrorBoundary
    FallbackComponent={props => <ErrorFallback {...props} componentName={componentName} />}
  >
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

// Pre-built suspense wrappers for specific components
export const InteractionLogSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SuspenseWrapper fallback={<InteractionLogSkeleton />} componentName="Interaction Log">
    {children}
  </SuspenseWrapper>
);

export const StatCardSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SuspenseWrapper fallback={<StatCardSkeleton />} componentName="Statistics Card">
    {children}
  </SuspenseWrapper>
);

export const PlanUsageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SuspenseWrapper fallback={<PlanUsageSkeleton />} componentName="Plan Usage">
    {children}
  </SuspenseWrapper>
);

// Generic dashboard loading skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Plan Usage */}
    <PlanUsageSkeleton />

    {/* Interaction Log */}
    <InteractionLogSkeleton />
  </div>
);
