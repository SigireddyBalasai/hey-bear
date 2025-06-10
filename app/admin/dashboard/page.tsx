'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

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
import { Activity, DollarSign, MessageSquare, Users } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/useAuth';
import type { DashboardData, UsageChartItem } from '@/types/app.types';
import { withErrorHandling } from '@/utils/error-handling';

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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    await withErrorHandling(
      async () => {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = (await response.json()) as DashboardData;
        setDashboardData(data);
      },
      {
        toastTitle: 'Dashboard Error',
        fallbackMessage: 'Failed to load dashboard data',
      }
    );
  }, [user]);

  // Load dashboard data when admin auth is complete
  useEffect(() => {
    if (!isLoading && isAdmin && user) {
      void fetchDashboardData();
    }
  }, [isLoading, isAdmin, user, fetchDashboardData]);

  const fetchTimeframeData = async (timeframe: string) => {
    setSelectedTimeRange(timeframe);

    await withErrorHandling(
      async () => {
        const response = await fetch(`/api/admin/usage-stats?timeframe=${timeframe}`);

        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }

        interface TimeSeriesResponse {
          timeSeriesData: Array<{
            date: string;
            count: number;
            tokens: number;
            cost: number;
          }>;
        }

        const data = (await response.json()) as TimeSeriesResponse;

        setDashboardData((prev: DashboardData | null) => {
          const newUsageChart = data.timeSeriesData;
          const result: DashboardData = {
            usageChart: newUsageChart,
            users: prev?.users ?? undefined,
            usage: prev?.usage ?? undefined,
          };
          return result;
        });
      },
      {
        toastTitle: 'Usage Data Error',
        fallbackMessage: 'Failed to load usage data',
      }
    );
  };

  const generateChartData = () => {
    if (!dashboardData?.usageChart || dashboardData.usageChart.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: dashboardData.usageChart.map((item: UsageChartItem) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Message Count',
          data: dashboardData.usageChart.map((item: UsageChartItem) => item.count),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Token Usage (hundreds)',
          data: dashboardData.usageChart.map((item: UsageChartItem) => item.tokens / 100),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this page.</p>
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
        <AdminHeader user={user} />

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

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Usage Overview</h2>
            <div className="flex gap-2">
              <Button
                variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => fetchTimeframeData('7d')}
                className="shadow-sm"
              >
                Week
              </Button>
              <Button
                variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => fetchTimeframeData('30d')}
                className="shadow-sm"
              >
                Month
              </Button>
              <Button
                variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => fetchTimeframeData('90d')}
                className="shadow-sm"
              >
                3 Months
              </Button>
            </div>
          </div>

          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="usage" className="flex-1 sm:flex-none">
                API Usage
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex-1 sm:flex-none">
                Token Consumption
              </TabsTrigger>
              <TabsTrigger value="costs" className="flex-1 sm:flex-none">
                Costs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Message Count Over Time</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Number of messages processed by the platform
                </p>
                <div className="h-80">
                  <Line
                    data={generateChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: 10,
                          cornerRadius: 6,
                        },
                      },
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                    }}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tokens" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Token Usage</h3>
                <p className="mb-6 text-sm text-muted-foreground">Token usage over time</p>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: (dashboardData?.usageChart ?? []).map((item: UsageChartItem) => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'Token Usage',
                          data: (dashboardData?.usageChart ?? []).map(
                            (item: UsageChartItem) => item.tokens
                          ),
                          backgroundColor: 'rgba(53, 162, 235, 0.7)',
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-medium">Cost Breakdown</h3>
                <p className="mb-6 text-sm text-muted-foreground">Estimated costs over time</p>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: (dashboardData?.usageChart ?? []).map((item: UsageChartItem) => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'Estimated Cost ($)',
                          data: (dashboardData?.usageChart ?? []).map(
                            (item: UsageChartItem) => item.cost
                          ),
                          backgroundColor: 'rgba(255, 159, 64, 0.7)',
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card
              className="cursor-pointer p-6 shadow-sm transition-all hover:shadow-md"
              onClick={() => {
                window.location.href = '/admin/users';
              }}
            >
              <h3 className="mb-2 flex items-center font-medium">
                <Users className="mr-2 h-5 w-5" /> Manage Users
              </h3>
              <p className="text-sm text-muted-foreground">
                View and manage user accounts, permissions, and usage
              </p>
            </Card>

            <Card
              className="cursor-pointer p-6 shadow-sm transition-all hover:shadow-md"
              onClick={() => {
                window.location.href = '/admin/usage';
              }}
            >
              <h3 className="mb-2 flex items-center font-medium">
                <DollarSign className="mr-2 h-5 w-5" /> Usage Analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Detailed usage reports and cost analysis
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
