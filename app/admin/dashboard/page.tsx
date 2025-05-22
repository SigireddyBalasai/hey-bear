"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/concierge/Loading';
import { fetchUsageData } from '@/components/admin/utils/adminUtils';
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
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TwilioIntegrationStatus } from '@/components/admin/TwilioIntegrationStatus';
import { UnassignedNumbersWidget } from '@/components/admin/UnassignedNumbersWidget';

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

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  
  const router = useRouter();
  const supabase = createClient();

  // Check if the current user is an admin
  useEffect(() => {
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
        
        // Fetch user record to check admin status
        const { data: userData, error: userDataError } = await supabase
          .schema('users')
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();
          
        if (userDataError || !userData?.is_admin) {
          toast("Access Denied", {
            description: "You don't have permission to access the admin dashboard",
          });
          setIsAdmin(false);
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        
        // Fetch dashboard data
        await fetchDashboardData();
        
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-summary');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

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

    // Define the shape of the dashboard data
    interface DashboardData {
      users?: {
        total: number;
        activeToday: number;
        activeThisWeek: number;
      };
      usage?: {
        totalMessages: number;
        totalCost: number;
      };
      usageChart: Array<{
        date: string;
        count: number;
        tokens: number;
        cost: number;
      }>;
    }

    const data = await response.json() as TimeSeriesResponse;
    
    setDashboardData((prev: DashboardData | null) => ({
      ...prev,
      usageChart: data.timeSeriesData
    }));
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
        datasets: []
      };
    }
    
    return {
      labels: dashboardData.usageChart.map((item: any) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Message Count',
          data: dashboardData.usageChart.map((item: any) => item.count),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Token Usage (hundreds)',
          data: dashboardData.usageChart.map((item: any) => item.tokens / 100),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ],
    };
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
                <h3 className="text-2xl font-bold">
                  ${(dashboardData?.usage?.totalCost || 0).toFixed(2)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
                onClick={() => fetchTimeframeData('7d')}
                className="shadow-sm"
              >
                Week
              </Button>
              <Button 
                variant={selectedTimeRange === '30d' ? "default" : "outline"}
                size="sm"
                onClick={() => fetchTimeframeData('30d')}
                className="shadow-sm"
              >
                Month
              </Button>
              <Button 
                variant={selectedTimeRange === '90d' ? "default" : "outline"}
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
              <TabsTrigger value="usage" className="flex-1 sm:flex-none">API Usage</TabsTrigger>
              <TabsTrigger value="tokens" className="flex-1 sm:flex-none">Token Consumption</TabsTrigger>
              <TabsTrigger value="costs" className="flex-1 sm:flex-none">Costs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="usage" className="space-y-4">
              <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-2">Message Count Over Time</h3>
                <p className="text-muted-foreground mb-6 text-sm">Number of messages processed by the platform</p>
                <div className="h-80">
                  <Line 
                    data={generateChartData()} 
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
                <h3 className="text-lg font-medium mb-2">Token Usage</h3>
                <p className="text-muted-foreground mb-6 text-sm">Token usage over time</p>
                <div className="h-80">
                  <Bar 
                    data={{
                      labels: (dashboardData?.usageChart || []).map((item: any) => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'Token Usage',
                          data: (dashboardData?.usageChart || []).map((item: any) => item.tokens),
                          backgroundColor: 'rgba(53, 162, 235, 0.7)',
                          borderRadius: 4,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
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
                    data={{
                      labels: (dashboardData?.usageChart || []).map((item: any) => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'Daily Cost ($)',
                          data: (dashboardData?.usageChart || []).map((item: any) => item.cost),
                          borderColor: 'rgb(255, 159, 64)',
                          backgroundColor: 'rgba(255, 159, 64, 0.5)',
                          tension: 0.3,
                          fill: true,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '$' + value;
                            }
                          }
                        }
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `Cost: $${context.raw}`;
                            }
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

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TwilioIntegrationStatus />
            <UnassignedNumbersWidget />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Quick Actions</h2>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/users')}>
              <h3 className="font-medium mb-2 flex items-center">
                <Users className="mr-2 h-5 w-5" /> Manage Users
              </h3>
              <p className="text-sm text-muted-foreground">
                View and manage user accounts, permissions, and usage
              </p>
            </Card>
            
            <Card className="p-6 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/monitoring')}>
              <h3 className="font-medium mb-2 flex items-center">
                <Activity className="mr-2 h-5 w-5" /> System Monitoring
              </h3>
              <p className="text-sm text-muted-foreground">
                Monitor system performance and real-time metrics
              </p>
            </Card>
            
            <Card className="p-6 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/usage')}>
              <h3 className="font-medium mb-2 flex items-center">
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
