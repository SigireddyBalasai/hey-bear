'use client';

import { useEffect } from 'react';

import {
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
import { Activity, DollarSign, MessageSquare, Users } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserUsageTable } from '@/components/admin/UserUsageTable';
import { AdminPhoneNumbersSection } from '@/components/admin/admin-phone-numbers-section';
import { DashboardCharts } from '@/components/admin/dashboard/DashboardCharts';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/useClientAuth';
import { useDashboardData } from '@/hooks/useDashboardData';

// Prevent static generation for admin pages - they require authentication
export const dynamic = 'force-dynamic';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const { selectedTimeRange, setSelectedTimeRange, dashboardStats, loadDashboardData } =
    useDashboardData();

  useEffect(() => {
    if (isAdmin) {
      void loadDashboardData();
    }
  }, [isAdmin, loadDashboardData]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }

    return num.toString();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeRange('90d')}
                >
                  90 Days
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(dashboardStats.users.total)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashboardStats.users.activeToday} active today
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Interactions</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(dashboardStats.interactions.total)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashboardStats.interactions.errorRate.toFixed(1)}% error rate
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Token Usage</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatNumber(dashboardStats.interactions.totalTokens)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashboardStats.users.activeThisWeek} users this week
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Activity className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cost Estimate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(dashboardStats.interactions.costEstimate)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(
                        dashboardStats.interactions.costEstimate /
                          Math.max(dashboardStats.interactions.total, 1)
                      )}{' '}
                      per interaction
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card className="p-6">
                  <DashboardCharts timeSeriesData={dashboardStats.timeSeriesData} />
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">User Usage Statistics</h2>
                  <UserUsageTable usageData={dashboardStats.userUsage} />
                </Card>
              </TabsContent>
            </Tabs>

            {/* Phone Numbers Management Section */}
            <AdminPhoneNumbersSection />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
