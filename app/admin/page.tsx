'use client';

import { useCallback, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { useRouter } from 'next/navigation';

import type { User } from '@supabase/supabase-js';
import {
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
import type { TooltipItem } from 'chart.js';
import { Activity, DollarSign, MessageSquare, Users } from 'lucide-react';
import { toast } from 'sonner';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserUsageTable } from '@/components/admin/UserUsageTable';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define UserUsageStats interface (similar to the one in UserUsageTable.tsx)
interface UserUsageStats {
  id: string; // Assuming user ID is a string (e.g., UUID)
  user_id: string;
  users?: {
    full_name?: string | null;
    email?: string | null;
    created_at?: string | null; // Added created_at
    last_active?: string | null;
  };
  date?: string | null; // Can be last_active or a relevant date for the stats
  message_count: number;
  token_usage: number;
  cost_estimate: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension?: number;
  fill?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales: {
    y: {
      beginAtZero: boolean;
      ticks?: {
        callback?: (value: string | number) => string; // Adjusted value type
      };
    };
  };
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      callbacks?: {
        label?: (context: TooltipItem<'line'> | TooltipItem<'bar'>) => string;
      };
    };
  };
}

interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costs: number;
  errors: number;
}

interface DashboardStats {
  users: {
    total: number;
    activeToday: number;
    activeThisWeek: number;
  };
  interactions: {
    total: number;
    totalTokens: number;
    costEstimate: number;
    errorRate: number;
  };
  timeSeriesData: TimeSeriesDataPoint[];
  userUsage: UserUsageStats[]; // Added field for user-specific usage stats
}

function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    users: {
      total: 0,
      activeToday: 0,
      activeThisWeek: 0,
    },
    interactions: {
      total: 0,
      totalTokens: 0,
      costEstimate: 0,
      errorRate: 0,
    },
    timeSeriesData: [],
    userUsage: [], // Initialize new field
  });

  const router = useRouter();
  const supabase = createClient();

  const loadDashboardData = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      // Calculate days to subtract based on selected time range
      let daysToSubtract = 30; // default
      if (selectedTimeRange === '7d') {
        daysToSubtract = 7;
      } else if (selectedTimeRange === '90d') {
        daysToSubtract = 90;
      }

      startDate.setDate(endDate.getDate() - daysToSubtract);

      // Get user stats - fetch only id and last_active, as full_name and email seem to be missing
      const { data: allUsers, error: usersError } = await supabase

        .from('users')
        .select('id, last_active'); // Select only id and last_active

      if (usersError) {
        // Log the error with more context
        let detailedErrorMessage = "Error fetching users from 'users.users' table.";
        if ('message' in usersError) {
          detailedErrorMessage += ` Message: ${usersError.message}`;
        }
        if ('details' in usersError) {
          detailedErrorMessage += ` Details: ${usersError.details}`;
        }
        if ('hint' in usersError) {
          detailedErrorMessage += ` Hint: ${usersError.hint}`;
        }
        console.error(detailedErrorMessage, usersError);
        toast.error('Failed to load user data. Check console for details.');
        throw usersError; // Re-throw the original error to stop execution
      }

      // Get interaction metrics
      const { data: interactions, error: interactionsError } = await supabase

        .from('interactions')
        .select('*')
        .gte('interaction_time', startDate.toISOString())
        .lte('interaction_time', endDate.toISOString());

      if (interactionsError) throw interactionsError;

      // Calculate time series data
      const timeSeriesMap = new Map<string, TimeSeriesDataPoint>();

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        timeSeriesMap.set(dateStr, {
          date: dateStr,
          interactions: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costs: 0,
          errors: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      interactions.forEach(interaction => {
        if (!interaction.interaction_time) return;

        const date = new Date(interaction.interaction_time).toISOString().split('T')[0];
        const data = timeSeriesMap.get(date);
        if (!data) return;

        data.interactions++;
        data.inputTokens += interaction.input_tokens ?? 0;
        data.outputTokens += interaction.output_tokens ?? 0;
        data.totalTokens += interaction.token_usage ?? 0;
        data.costs += interaction.cost_estimate ?? 0;
        if (interaction.is_error) data.errors++;
      });

      const timeSeriesData = [...timeSeriesMap.values()];

      // Calculate user activity
      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const activeToday = allUsers.filter(
        u => u.last_active && new Date(u.last_active) >= oneDayAgo
      ).length;
      const activeThisWeek = allUsers.filter(
        u => u.last_active && new Date(u.last_active) >= sevenDaysAgo
      ).length;

      // Aggregate interaction stats per user
      const userInteractionStats = new Map<
        string,
        { message_count: number; token_usage: number; cost_estimate: number }
      >();

      interactions.forEach(interaction => {
        if (!interaction.user_id) return; // Restored check for null/undefined user_id

        const stats = userInteractionStats.get(interaction.user_id) ?? {
          message_count: 0,
          token_usage: 0,
          cost_estimate: 0,
        };

        stats.message_count++;
        stats.token_usage += interaction.token_usage ?? 0;
        stats.cost_estimate += interaction.cost_estimate ?? 0;

        userInteractionStats.set(interaction.user_id, stats);
      });

      // Prepare UserUsageStats array
      const userUsage: UserUsageStats[] = allUsers
        .map(user => {
          const aggregatedStats = userInteractionStats.get(user.id) ?? {
            message_count: 0,
            token_usage: 0,
            cost_estimate: 0,
          };
          return {
            id: user.id,
            user_id: user.id,
            users: {
              full_name: null, // Set to null as full_name is not selected (and reported missing by DB)
              email: null, // Set to null as email is not selected (and reported missing by DB)
              created_at: null, // Set to null as created_at is not selected (and reported missing by DB)
              last_active: user.last_active, // Use last_active (if it exists and is selected)
            },
            date: user.last_active,
            message_count: aggregatedStats.message_count,
            token_usage: aggregatedStats.token_usage,
            cost_estimate: aggregatedStats.cost_estimate,
          };
        })
        .sort((a, b) => b.message_count - a.message_count); // Example: sort by message_count desc for "Top Users"

      // Update dashboard stats
      setDashboardStats({
        users: {
          total: allUsers.length,
          activeToday,
          activeThisWeek,
        },
        interactions: {
          total: interactions.length,
          totalTokens: interactions.reduce((sum, i) => sum + (i.token_usage ?? 0), 0),
          costEstimate: interactions.reduce((sum, i) => sum + (i.cost_estimate ?? 0), 0),
          errorRate:
            interactions.length > 0
              ? interactions.filter(i => i.is_error).length / interactions.length
              : 0,
        },
        timeSeriesData,
        userUsage, // Add the populated userUsage data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, [selectedTimeRange, supabase]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !currentUser) {
          router.push('/');
          return;
        }

        setUser(currentUser);

        const { data: adminCheck, error: adminError } = await supabase

          .from('users')
          .select('is_admin')
          .eq('auth_user_id', currentUser.id)
          .single();

        if (adminError || !adminCheck.is_admin) {
          router.push('/');
          return;
        }

        setIsAdmin(true);
        await loadDashboardData();
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Error checking admin status');
      } finally {
        setIsLoading(false);
      }
    };

    void checkAdminStatus();
  }, [router, supabase, loadDashboardData]);

  const generateChartData = (dataType: 'interactions' | 'tokens' | 'costs'): ChartData => {
    const { timeSeriesData } = dashboardStats;

    // Helper function to get data values based on type
    const getDataValue = (d: TimeSeriesDataPoint) => {
      if (dataType === 'interactions') return d.interactions;
      if (dataType === 'tokens') return d.totalTokens;
      return d.costs;
    };

    // Helper function to get border color based on type
    const getBorderColor = () => {
      if (dataType === 'interactions') return 'rgb(75, 192, 192)';
      if (dataType === 'tokens') return 'rgb(255, 99, 132)';
      return 'rgb(255, 159, 64)';
    };

    // Helper function to get background color based on type
    const getBackgroundColor = () => {
      if (dataType === 'interactions') return 'rgba(75, 192, 192, 0.1)';
      if (dataType === 'tokens') return 'rgba(255, 99, 132, 0.1)';
      return 'rgba(255, 159, 64, 0.1)';
    };

    // Helper function to get label based on type
    const getLabel = () => {
      if (dataType === 'interactions') return 'Daily Interactions';
      if (dataType === 'tokens') return 'Token Usage';
      return 'Daily Costs';
    };

    return {
      labels: timeSeriesData.map(d => d.date),
      datasets: [
        {
          label: getLabel(),
          data: timeSeriesData.map(data => getDataValue(data)),
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
          fill: true,
          tension: 0.3,
        },
      ],
    };
  };

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value.toString(),
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
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
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold">{dashboardStats.users.total}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dashboardStats.users.activeToday} active today
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interactions</p>
                <h3 className="text-2xl font-bold">{dashboardStats.interactions.total}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(dashboardStats.interactions.total / 30)} daily avg
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Token Usage</p>
                <h3 className="text-2xl font-bold">
                  {(dashboardStats.interactions.totalTokens / 1000).toFixed(1)}K
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last{' '}
                  {(() => {
                    if (selectedTimeRange === '7d') return '7';
                    if (selectedTimeRange === '30d') return '30';
                    return '90';
                  })()}{' '}
                  days
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <h3 className="text-2xl font-bold">
                  ${dashboardStats.interactions.costEstimate.toFixed(2)}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  ~${(dashboardStats.interactions.costEstimate / 30).toFixed(2)} daily avg
                </p>
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
                onClick={() => {
                  setSelectedTimeRange('7d');
                }}
              >
                Week
              </Button>
              <Button
                variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedTimeRange('30d');
                }}
              >
                Month
              </Button>
              <Button
                variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedTimeRange('90d');
                }}
              >
                Quarter
              </Button>
            </div>
          </div>

          <Tabs defaultValue="usage">
            <TabsList className="mb-4">
              <TabsTrigger value="usage">API Usage</TabsTrigger>
              <TabsTrigger value="tokens">Token Consumption</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>

            <TabsContent value="usage">
              <Card className="p-6">
                <h3 className="mb-2 text-lg font-medium">Message Count Over Time</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Number of API requests made by users
                </p>
                <div className="h-80">
                  <Line data={generateChartData('interactions')} options={chartOptions} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tokens">
              <Card className="p-6">
                <h3 className="mb-2 text-lg font-medium">Token Usage Breakdown</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Input and output tokens consumed by the platform
                </p>
                <div className="h-80">
                  <Line data={generateChartData('tokens')} options={chartOptions} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="costs">
              <Card className="p-6">
                <h3 className="mb-2 text-lg font-medium">Cost Analysis</h3>
                <p className="mb-6 text-sm text-muted-foreground">Platform costs from API usage</p>
                <div className="h-80">
                  <Line
                    data={generateChartData('costs')}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          ticks: {
                            callback: value => `$${String(value)}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Top Users</h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                router.push('/admin/users');
              }}
            >
              View All Users
            </Button>
          </div>
          <Card className="shadow-sm">
            <UserUsageTable usageData={dashboardStats.userUsage} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
