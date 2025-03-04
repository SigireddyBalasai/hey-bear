import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, description, loading }: { title: string, value: string | number, description: string, loading: boolean }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <>
          <Skeleton className="h-8 w-16 rounded-md mb-2" />
          <Skeleton className="h-3 w-full rounded-md" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);

export default StatCard;
