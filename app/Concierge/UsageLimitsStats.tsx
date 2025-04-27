import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from "@/lib/utils";

interface UsageLimitsStatsProps {
  assistantId: string;
}

interface UsageStats {
  messages: {
    used: number;
    limit: number;
    remaining: number;
  };
  documents: {
    used: number;
    limit: number;
    remaining: number;
  };
  webpages: {
    used: number;
    limit: number;
    remaining: number;
  };
  lastReset: string;
}

// Custom Progress component that allows for different colored indicators
const ColoredProgress = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Progress> & { indicatorColor?: string }
>(({ className, value, indicatorColor, ...props }, ref) => (
  <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)} ref={ref} {...props}>
    <div 
      className="h-full transition-all" 
      style={{ 
        width: `${value || 0}%`, 
        backgroundColor: indicatorColor || 'var(--primary)' 
      }} 
    />
  </div>
))
ColoredProgress.displayName = "ColoredProgress";

export default function UsageLimitsStats({ assistantId }: UsageLimitsStatsProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsageStats() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/Concierge/usage-stats?assistantId=${assistantId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch usage stats: ${response.status}`);
        }
        
        const data = await response.json();
        setUsageStats(data);
      } catch (err) {
        console.error('Error fetching usage stats:', err);
        setError('Failed to load usage statistics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    if (assistantId) {
      fetchUsageStats();
    }
  }, [assistantId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Loading...</div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!usageStats) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  const calculatePercentage = (used: number, limit: number) => {
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#ef4444'; // red-500
    if (percentage >= 70) return '#fb923c'; // orange-400
    return '#22c55e'; // green-500
  };

  const messagePercentage = calculatePercentage(usageStats.messages.used, usageStats.messages.limit);
  const documentsPercentage = calculatePercentage(usageStats.documents.used, usageStats.documents.limit);
  const webpagesPercentage = calculatePercentage(usageStats.webpages.used, usageStats.webpages.limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Usage Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Messages</div>
              <div className="text-xs text-gray-500">
                {usageStats.messages.used} / {usageStats.messages.limit}
              </div>
            </div>
            <ColoredProgress
              value={messagePercentage}
              indicatorColor={getProgressColor(messagePercentage)}
              className="h-2"
            />
            {messagePercentage >= 90 && (
              <p className="text-xs text-red-500 mt-1">
                You're running low on messages this month! Consider upgrading your plan.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Documents</div>
              <div className="text-xs text-gray-500">
                {usageStats.documents.used} / {usageStats.documents.limit}
              </div>
            </div>
            <ColoredProgress
              value={documentsPercentage}
              indicatorColor={getProgressColor(documentsPercentage)}
              className="h-2"
            />
            {documentsPercentage >= 90 && (
              <p className="text-xs text-red-500 mt-1">
                You're approaching your document limit! Consider upgrading your plan.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Webpages</div>
              <div className="text-xs text-gray-500">
                {usageStats.webpages.used} / {usageStats.webpages.limit}
              </div>
            </div>
            <ColoredProgress
              value={webpagesPercentage}
              indicatorColor={getProgressColor(webpagesPercentage)}
              className="h-2"
            />
            {webpagesPercentage >= 90 && (
              <p className="text-xs text-red-500 mt-1">
                You're approaching your webpage limit! Consider upgrading your plan.
              </p>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            Messages reset monthly. Last reset: {formatDate(usageStats.lastReset)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}