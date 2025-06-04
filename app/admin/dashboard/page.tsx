'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';

import { useRouter } from 'next/navigation';

import type { User } from '@supabase/supabase-js';
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
import { toast } from 'sonner';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TwilioIntegrationStatus } from '@/components/admin/TwilioIntegrationStatus';
import { UnassignedNumbersWidget } from '@/components/admin/UnassignedNumbersWidget';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';

// Register Chart.js components
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

// Define UsageChartItem type
type UsageChartItem = {
  date: string;
  count: number;
  tokens: number;
  cost: number;
};

interface DashboardData {
  usageChart: Array<UsageChartItem>; // Use UsageChartItem here
  users?: {
    // Made optional
    total: number;
    activeToday: number;
    activeThisWeek: number;
  };
  usage?: {
    // Made optional
    totalMessages: number;
    totalCost: number;
  };
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const router = useRouter();
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = (await response.json()) as DashboardData;
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, [user]);

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(user);

        // Fetch user record to check admin status
        const { data: userData, error: userDataError } = await supabase

          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();

        if (userDataError || !userData.is_admin) {
          toast('Access Denied', {
            description: "You don't have permission to access the admin dashboard",
          });
          setIsAdmin(false);
          router.push('/');
          return;
        }

        setIsAdmin(true);

        // Fetch dashboard data once we know user is admin
        await fetchDashboardData();
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    void checkAdminStatus();
  }, [router, fetchDashboardData, supabase]); // Added supabase to dependency array

  // Fetch usage data for different timeframe
  const fetchTimeframeData = async (timeframe: string) => {
    setSelectedTimeRange(timeframe);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/usage-stats?timeframe=${timeframe}`);

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      // Update the usageChart data in dashboardData
      // Define the shape of the API response
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
        // Explicitly construct the new state to align with DashboardData type
        const result: DashboardData = {
          usageChart: newUsageChart,
          users: prev?.users ?? undefined,
          usage: prev?.usage ?? undefined,
        };
        return result;
      });
    } catch (error) {
      console.error('Error fetching timeframe data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chart data based on dashboard data
  const generateChartData = () => {
    if (!dashboardData?.usageChart || dashboardData.usageChart.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: dashboardData.usageChart.map((item: UsageChartItem) => {
        // Typed item
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Message Count',
          data: dashboardData.usageChart.map((item: UsageChartItem) => item.count), // Typed item
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Token Usage (hundreds)',
          data: dashboardData.usageChart.map((item: UsageChartItem) => item.tokens / 100), // Typed item
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
              router.push('/');
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
                        // Typed item
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'Token Usage',
                          data: (dashboardData?.usageChart ?? []).map(
                            (item: UsageChartItem) => item.tokens
                          ), // Typed item
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
                        // Typed item
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'Estimated Cost ($)',
                          data: (dashboardData?.usageChart ?? []).map(
                            (item: UsageChartItem) => item.cost
                          ), // Typed item
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

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold">System Status</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TwilioIntegrationStatus />
            <UnassignedNumbersWidget />
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card
              className="cursor-pointer p-6 shadow-sm transition-all hover:shadow-md"
              onClick={() => {
                router.push('/admin/users');
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
                router.push('/admin/monitoring');
              }}
            >
              <h3 className="mb-2 flex items-center font-medium">
                <Activity className="mr-2 h-5 w-5" /> System Monitoring
              </h3>
              <p className="text-sm text-muted-foreground">
                Monitor system performance and real-time metrics
              </p>
            </Card>

            <Card
              className="cursor-pointer p-6 shadow-sm transition-all hover:shadow-md"
              onClick={() => {
                router.push('/admin/usage');
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
