'use client';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TokenDistributionChart } from '@/components/admin/usage/TokenDistributionChart';
import { UsageCostChart } from '@/components/admin/usage/UsageCostChart';
import { UsageFilterControls } from '@/components/admin/usage/UsageFilterControls';
import { UsageStatsCards } from '@/components/admin/usage/UsageStatsCards';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useClientAuth';
import { useUsageAnalytics } from '@/hooks/useUsageAnalytics';

// Prevent prerendering during build
export const dynamic = 'force-dynamic';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function UsagePage() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const {
    selectedTimeframe,
    selectedModel,
    selectedAssistant,
    selectedPlan,
    assistants,
    timeSeriesData,
    tokenDistribution,
    totalStats,
    costTrend,
    userStats,
    handleTimeframeChange,
    handleModelChange,
    handleAssistantChange,
    handlePlanChange,
  } = useUsageAnalytics();

  if (isLoading) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6">You don&apos;t have permission to access this page.</p>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="max-h-screen flex-1 overflow-y-auto p-8">
        <AdminHeader
          user={{
            email: user.email || '',
            user_metadata: {
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
            },
          }}
        />

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor API usage, costs, and user activity across your platform
          </p>
        </div>

        <UsageFilterControls
          selectedTimeframe={selectedTimeframe}
          selectedModel={selectedModel}
          selectedAssistant={selectedAssistant}
          selectedPlan={selectedPlan}
          assistants={assistants}
          onTimeframeChange={handleTimeframeChange}
          onModelChange={handleModelChange}
          onAssistantChange={handleAssistantChange}
          onPlanChange={handlePlanChange}
        />

        <UsageStatsCards totalStats={totalStats} costTrend={costTrend} />

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UsageCostChart timeSeriesData={timeSeriesData} />
          <TokenDistributionChart tokenDistribution={tokenDistribution} totalStats={totalStats} />
        </div>

        {/* User Statistics Table */}
        {userStats.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Top Users by Usage</h2>
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-medium">User</th>
                      <th className="p-4 text-left font-medium">Interactions</th>
                      <th className="p-4 text-left font-medium">Tokens</th>
                      <th className="p-4 text-left font-medium">Cost</th>
                      <th className="p-4 text-left font-medium">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.slice(0, 10).map(user => (
                      <tr key={user.userId} className="border-b last:border-b-0">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{user.fullName || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4">{user.interactions.toLocaleString()}</td>
                        <td className="p-4">{user.tokens.toLocaleString()}</td>
                        <td className="p-4">${user.costs.toFixed(2)}</td>
                        <td className="p-4">{user.percentage?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
