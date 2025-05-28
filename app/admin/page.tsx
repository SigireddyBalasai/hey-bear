"use client";
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/concierge/Loading';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DollarSign, Users, MessageSquare, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler 
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserUsageTable } from '@/components/admin/UserUsageTable';

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
      activeThisWeek: 0
    },
    interactions: {
      total: 0,
      totalTokens: 0,
      costEstimate: 0,
      errorRate: 0
    },
    timeSeriesData: [],
    userUsage: [] // Initialize new field
  });

  const router = useRouter();
  const supabase = createClient();

  const loadDashboardData = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90));

      // Get user stats - fetch only id and last_active, as full_name and email seem to be missing
      const { data: allUsers, error: usersError } = await supabase
        .schema('users')
        .from('users')
        .select('id, last_active'); // Select only id and last_active

      if (usersError) {
        // Log the error with more context
        let detailedErrorMessage = "Error fetching users from 'users.users' table.";
        if (typeof usersError === 'object' && usersError !== null && 'message' in usersError && typeof usersError.message === 'string') {
          detailedErrorMessage += ` Message: ${usersError.message}`;
        }
        if (typeof usersError === 'object' && usersError !== null && 'details' in usersError && typeof usersError.details === 'string') {
          detailedErrorMessage += ` Details: ${usersError.details}`;
        }
        if (typeof usersError === 'object' && usersError !== null && 'hint' in usersError && typeof usersError.hint === 'string') {
          detailedErrorMessage += ` Hint: ${usersError.hint}`;
        }
        console.error(detailedErrorMessage, usersError);
        toast.error('Failed to load user data. Check console for details.');
        throw usersError; // Re-throw the original error to stop execution
      }

      if (!allUsers) {
        // This case handles if Supabase returns null for data without an error object,
        // or if the query somehow results in allUsers being undefined.
        console.error("No data returned from 'users.users' table query (allUsers is null or undefined), and no explicit Supabase error was thrown.");
        toast.error("Failed to load user data: Received no data from the server.");
        throw new Error("User data query returned null or undefined, stopping dashboard load.");
      }

      // Get interaction metrics
      const { data: interactions, error: interactionsError } = await supabase
        .schema('analytics')
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
          errors: 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      interactions.forEach((interaction) => {
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

      const timeSeriesData = Array.from(timeSeriesMap.values());

      // Calculate user activity
      const now = new Date();
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const activeToday = allUsers.filter(u => u.last_active && new Date(u.last_active) >= oneDayAgo).length;
      const activeThisWeek = allUsers.filter(u => u.last_active && new Date(u.last_active) >= sevenDaysAgo).length;

      // Aggregate interaction stats per user
      const userInteractionStats = new Map<string, { message_count: number, token_usage: number, cost_estimate: number }>();

      interactions.forEach(interaction => {
        if (!interaction.user_id) return; // Restored check for null/undefined user_id

        const stats = userInteractionStats.get(interaction.user_id) ?? {
          message_count: 0,
          token_usage: 0,
          cost_estimate: 0
        };

        stats.message_count++;
        stats.token_usage += interaction.token_usage ?? 0;
        stats.cost_estimate += interaction.cost_estimate ?? 0;
        
        userInteractionStats.set(interaction.user_id, stats);
      });

      // Prepare UserUsageStats array
      const userUsage: UserUsageStats[] = allUsers.map(user => {
        const aggregatedStats = userInteractionStats.get(user.id) ?? {
          message_count: 0,
          token_usage: 0,
          cost_estimate: 0
        };
        return {
          id: user.id,
          user_id: user.id,
          users: {
            full_name: null, // Set to null as full_name is not selected (and reported missing by DB)
            email: null,     // Set to null as email is not selected (and reported missing by DB)
            created_at: null, // Set to null as created_at is not selected (and reported missing by DB)
            last_active: user.last_active, // Use last_active (if it exists and is selected)
          },
          date: user.last_active, 
          message_count: aggregatedStats.message_count,
          token_usage: aggregatedStats.token_usage,
          cost_estimate: aggregatedStats.cost_estimate,
        };
      }).sort((a, b) => b.message_count - a.message_count); // Example: sort by message_count desc for "Top Users"

      // Update dashboard stats
      setDashboardStats({
        users: {
          total: allUsers.length,
          activeToday,
          activeThisWeek
        },
        interactions: {
          total: interactions.length,
          totalTokens: interactions.reduce((sum, i) => sum + i.token_usage, 0),
          costEstimate: interactions.reduce((sum, i) => sum + i.cost_estimate, 0),
          errorRate: interactions.length ? interactions.filter(i => i.is_error).length / interactions.length : 0
        },
        timeSeriesData,
        userUsage // Add the populated userUsage data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, [selectedTimeRange, supabase]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) {
          router.push('/');
          return;
        }

        setUser(currentUser);

        const { data: adminCheck, error: adminError } = await supabase
          .schema('users')
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', currentUser.id)
          .single();

        if (adminError || !adminCheck?.is_admin) {
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

    checkAdminStatus();
  }, [router, supabase, loadDashboardData]);

  const generateChartData = (dataType: 'interactions' | 'tokens' | 'costs'): ChartData => {
    const { timeSeriesData } = dashboardStats;
    
    return {
      labels: timeSeriesData.map(d => d.date),
      datasets: [{
        label: dataType === 'interactions' ? 'Daily Interactions'
          : dataType === 'tokens' ? 'Token Usage'
          : 'Daily Costs',
        data: timeSeriesData.map(d => 
          dataType === 'interactions' ? d.interactions
          : dataType === 'tokens' ? d.totalTokens
          : d.costs
        ),
        borderColor: dataType === 'interactions' ? 'rgb(75, 192, 192)'
          : dataType === 'tokens' ? 'rgb(255, 99, 132)'
          : 'rgb(255, 159, 64)',
        backgroundColor: dataType === 'interactions' ? 'rgba(75, 192, 192, 0.1)'
          : dataType === 'tokens' ? 'rgba(255, 99, 132, 0.1)'
          : 'rgba(255, 159, 64, 0.1)',
        fill: true,
        tension: 0.3
      }]
    };
  };

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toString()
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => router.push('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        <AdminHeader user={user} />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold">{dashboardStats.users.total}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardStats.users.activeToday} active today
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interactions</p>
                <h3 className="text-2xl font-bold">{dashboardStats.interactions.total}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(dashboardStats.interactions.total / 30)} daily avg
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
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
                <p className="text-xs text-muted-foreground mt-1">
                  Last {selectedTimeRange === '7d' ? '7' : selectedTimeRange === '30d' ? '30' : '90'} days
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
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
                <p className="text-xs text-muted-foreground mt-1">
                  ~${(dashboardStats.interactions.costEstimate / 30).toFixed(2)} daily avg
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Usage Overview</h2>
            <div className="flex gap-2">
              <Button 
                variant={selectedTimeRange === '7d' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeRange('7d')}
              >
                Week
              </Button>
              <Button 
                variant={selectedTimeRange === '30d' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeRange('30d')}
              >
                Month
              </Button>
              <Button 
                variant={selectedTimeRange === '90d' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeRange('90d')}
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
                <h3 className="text-lg font-medium mb-2">Message Count Over Time</h3>
                <p className="text-muted-foreground mb-6 text-sm">Number of API requests made by users</p>
                <div className="h-80">
                  <Line 
                    data={generateChartData('interactions')}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tokens">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-2">Token Usage Breakdown</h3>
                <p className="text-muted-foreground mb-6 text-sm">Input and output tokens consumed by the platform</p>
                <div className="h-80">
                  <Line 
                    data={generateChartData('tokens')}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="costs">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-2">Cost Analysis</h3>
                <p className="text-muted-foreground mb-6 text-sm">Platform costs from API usage</p>
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
                            callback: (value) => `$${value}`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Top Users</h2>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/admin/users')}>
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
