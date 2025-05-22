"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/concierge/Loading';
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
import { Line, Bar } from 'react-chartjs-2';
import { UserUsageTable } from '@/components/admin/UserUsageTable';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';


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

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    interactions: 0,
    tokens: 0,
    costs: 0,
    errors: 0,
    activeUsers: 0
  });
  const [userStats, setUserStats] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>({
    users: { total: 0, activeToday: 0, activeThisWeek: 0 },
    usage: { totalMessages: 0, tokensUsed: 0, costEstimate: 0 }
  });

  const router = useRouter();
  const supabase = createClient();

  // Check if the current user is an admin
  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        setUser(null);
        router.push('/sign-in');
        return;
      }
      
      setUser(user);
      setIsAdmin(true); // For demo purposes
      
      // Load mock dashboard data
      await loadDashboardData();
      
    } catch (error) {
      console.error('Error in checking admin status:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock time series data
  const generateMockTimeSeriesData = (days: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        interactions: Math.floor(Math.random() * 100) + 50,
        tokens: Math.floor(Math.random() * 10000) + 5000,
        costs: Number((Math.random() * 10 + 5).toFixed(2))
      });
    }
    
    return data;
  };

  // Generate mock user stats
  const generateMockUserStats = (count: number) => {
    const stats = [];
    for (let i = 0; i < count; i++) {
      stats.push({
        id: `user-${i + 1}`,
        full_name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        message_count: Math.floor(Math.random() * 1000) + 100,
        token_usage: Math.floor(Math.random() * 50000) + 5000,
        cost_estimate: Number((Math.random() * 50 + 10).toFixed(2)),
        last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    return stats;
  };

  // Load mock dashboard data
  const loadDashboardData = async () => {
    try {
      // Generate mock time series data based on selected timeframe
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const mockTimeSeriesData = generateMockTimeSeriesData(days);
      
      // Calculate mock total stats
      const mockTotalStats = {
        interactions: mockTimeSeriesData.reduce((sum, day) => sum + day.interactions, 0),
        tokens: mockTimeSeriesData.reduce((sum, day) => sum + day.tokens, 0),
        costs: Number(mockTimeSeriesData.reduce((sum, day) => sum + day.costs, 0).toFixed(2)),
        errors: Math.floor(Math.random() * 50),
        activeUsers: Math.floor(Math.random() * 100) + 50
      };

      // Generate mock user stats
      const mockUserStats = generateMockUserStats(20);

      // Update state with mock data
      setTimeSeriesData(mockTimeSeriesData);
      setTotalStats(mockTotalStats);
      setUserStats(mockUserStats);
      setDashboardData({
        users: {
          total: 500,
          activeToday: Math.floor(Math.random() * 100) + 20,
          activeThisWeek: Math.floor(Math.random() * 300) + 100
        },
        usage: {
          totalMessages: mockTotalStats.interactions,
          tokensUsed: mockTotalStats.tokens,
          costEstimate: mockTotalStats.costs
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error("Failed to load dashboard data");
    }
  };

  // Generate chart data based on the real data
  const generateChartData = (dataType: 'interactions' | 'tokens' | 'costs') => {
    const labels = timeSeriesData.map(entry => {
      const date = new Date(entry.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Prepare data structure for charts
    return {
      labels,
      datasets: [
        {
          label: dataType === 'interactions' ? 'Message Count' :
            dataType === 'tokens' ? 'Token Usage' :
              'Daily Cost ($)',
          data: timeSeriesData.map(entry => entry[dataType]),
          borderColor: dataType === 'interactions' ? 'rgb(53, 162, 235)' :
            dataType === 'tokens' ? 'rgb(255, 99, 132)' :
              'rgb(255, 159, 64)',
          backgroundColor: dataType === 'interactions' ? 'rgba(53, 162, 235, 0.5)' :
            dataType === 'tokens' ? 'rgba(255, 99, 132, 0.5)' :
              'rgba(255, 159, 64, 0.2)',
          tension: 0.3,
          fill: dataType === 'costs'
        }
      ],
    };
  };

  // Generate data for token breakdown chart
  const generateTokenBreakdownData = () => {
    const labels = timeSeriesData.map(entry => {
      const date = new Date(entry.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // For this example we'll estimate that input tokens are ~40% and output tokens are ~60% of total
    return {
      labels,
      datasets: [
        {
          label: 'Input Tokens',
          data: timeSeriesData.map(entry => Math.round(entry.tokens * 0.4)),
          backgroundColor: 'rgba(53, 162, 235, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Output Tokens',
          data: timeSeriesData.map(entry => Math.round(entry.tokens * 0.6)),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderRadius: 4,
        }
      ]
    };
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Handle time range changes
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    // Refresh data with new time range
    loadDashboardData();
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
          <Card className="p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold">{dashboardData?.users?.total || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData?.users?.activeToday || 0} active today
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h3 className="text-2xl font-bold">{dashboardData?.users?.activeThisWeek || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <h3 className="text-2xl font-bold">{dashboardData?.usage?.totalMessages || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Estimate</p>
                <h3 className="text-2xl font-bold">${dashboardData?.usage?.costEstimate?.toFixed(2) || "0.00"}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ~${((dashboardData?.usage?.costEstimate || 0) / 30).toFixed(2)} daily avg
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
                onClick={() => handleTimeRangeChange('7d')}
                className="shadow-sm"
              >
                Week
              </Button>
              <Button
                variant={selectedTimeRange === '30d' ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeRangeChange('30d')}
                className="shadow-sm"
              >
                Month
              </Button>
              <Button
                variant={selectedTimeRange === '90d' ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeRangeChange('90d')}
                className="shadow-sm"
              >
                Quarter
              </Button>
            </div>
          </div>

          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="usage" className="flex-1 sm:flex-none">API Usage</TabsTrigger>
              <TabsTrigger value="tokens" className="flex-1 sm:flex-none">Token Consumption</TabsTrigger>
              <TabsTrigger value="costs" className="flex-1 sm:flex-none">Costs</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Message Count Over Time</h3>
                <p className="text-muted-foreground mb-6 text-sm">Number of interactions processed by the platform</p>
                <div className="h-80">
                  <Line
                    data={generateChartData('interactions')}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: 10,
                          cornerRadius: 6
                        }
                      },
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      }
                    }}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tokens" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Token Usage Breakdown</h3>
                <p className="text-muted-foreground mb-6 text-sm">Input and output tokens consumed by the platform</p>
                <div className="h-80">
                  <Bar
                    data={generateTokenBreakdownData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: 10,
                          cornerRadius: 6
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Estimated Costs</h3>
                <p className="text-muted-foreground mb-6 text-sm">Daily cost estimates based on token usage</p>
                <div className="h-80">
                  <Line
                    data={generateChartData('costs')}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return '$' + value;
                            }
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: 10,
                          cornerRadius: 6,
                          callbacks: {
                            label: function (context) {
                              return `Cost: $${context.parsed.y.toFixed(2)}`;
                            }
                          }
                        }
                      },
                      interaction: {
                        mode: 'index',
                        intersect: false,
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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/admin/user-usage')}>
              View All Users
            </Button>
          </div>
          <Card className="shadow-sm">
            <UserUsageTable usageData={userStats.slice(0, 10)} />
          </Card>
        </div>
      </div>
    </div>
  );
}
