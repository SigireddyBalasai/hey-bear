'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardStatsCards } from '@/components/admin/dashboard/DashboardStatsCards';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { TimeRangeSelector } from '@/components/admin/dashboard/TimeRangeSelector';
import { UsageCharts } from '@/components/admin/dashboard/UsageCharts';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useAdminAuth } from '@/hooks/useClientAuth';

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
  Legend
);

export default function AdminDashboardPage() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const { dashboardData, selectedTimeRange, fetchTimeframeData, generateChartData } =
    useAdminDashboard(user, isAdmin, isLoading);

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
            email: user.email ?? '',
            user_metadata: {
              full_name: user.user_metadata?.full_name ?? '',
              avatar_url: user.user_metadata?.avatar_url ?? '',
            },
          }}
        />

        <DashboardStatsCards dashboardData={dashboardData} />

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Usage Overview</h2>
            <TimeRangeSelector
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={fetchTimeframeData}
            />
          </div>

          <UsageCharts dashboardData={dashboardData} generateChartData={generateChartData} />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}
