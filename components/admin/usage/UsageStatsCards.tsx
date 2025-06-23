import { ArrowDown, ArrowUp, BarChart3, CircleDollarSign, TrendingUp } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminUsageStatsCardsProps } from '@/types/admin.types';

export function UsageStatsCards({ totalStats, costTrend }: AdminUsageStatsCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Cost</CardDescription>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">${totalStats.costs.toFixed(2)}</CardTitle>
            <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          <div
            className={`flex items-center space-x-1 text-xs ${
              costTrend.isIncrease ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {costTrend.isIncrease ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span>{costTrend.change.toFixed(1)}% from previous period</span>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Tokens</CardDescription>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">
              {totalStats.tokens.toLocaleString()}
            </CardTitle>
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-xs text-muted-foreground">
            Active users: {totalStats.activeUsers}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Interactions</CardDescription>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">
              {totalStats.interactions.toLocaleString()}
            </CardTitle>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-xs text-muted-foreground">
            {totalStats.errors} errors (
            {((totalStats.errors / Math.max(totalStats.interactions, 1)) * 100).toFixed(1)}%)
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
