import { Activity, DollarSign, MessageSquare, Users } from 'lucide-react';

import { Activity, DollarSign, MessageSquare, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { AdminDashboardStatsCardsProps } from '@/types/admin.types';
import type { DashboardData } from '@/types/interaction.types';

export function DashboardStatsCards({ dashboardData }: AdminDashboardStatsCardsProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            <h3 className="text-2xl font-bold">{dashboardData?.users?.total ?? 0}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboardData?.users?.activeToday ?? 0} active today
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Users</p>
            <h3 className="text-2xl font-bold">{dashboardData?.users?.activeThisWeek ?? 0}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
            <h3 className="text-2xl font-bold">{dashboardData?.usage?.totalMessages ?? 0}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
            <MessageSquare className="h-6 w-6 text-violet-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cost Estimate</p>
            <h3 className="text-2xl font-bold">
              ${(dashboardData?.usage?.totalCost ?? 0).toFixed(2)}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
