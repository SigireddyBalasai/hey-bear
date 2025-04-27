import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from './DataContext';

const PlanUsage = () => {
  const { isLoading, stats } = useData();
  
  // Calculate percentages for progress bars
  const smsReceivedParts = stats.smsReceived.split('/');
  const smsSentParts = stats.smsSent.split('/');
  
  const smsReceivedPercentage = (parseInt(smsReceivedParts[0]) / parseInt(smsReceivedParts[1])) * 100;
  const smsSentPercentage = (parseInt(smsSentParts[0]) / parseInt(smsSentParts[1])) * 100;
  
  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Plan Usage</CardTitle>
            <CardDescription>Track your usage to ensure you stay within your plan's limits</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>SMS Received</span>
                  <span>{stats.smsReceived}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${smsReceivedPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>SMS Sent</span>
                  <span>{stats.smsSent}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${smsSentPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanUsage;
