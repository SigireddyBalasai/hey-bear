"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '../../Concierge/Loading';
import { fetchUsageData } from '../utils/adminUtils';
import { 
  CircleDollarSign, 
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Table components
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSidebar } from '../AdminSidebar';
import { AdminHeader } from '../AdminHeader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,  // Add PointElement import
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,  // Register PointElement
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function UsageAnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedModel, setSelectedModel] = useState('all');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  // Replace model distribution with token distribution
  const [tokenDistribution, setTokenDistribution] = useState<{type: string, tokens: number, percentage: number}[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    interactions: 0,
    tokens: 0,
    costs: 0,
    errors: 0,
    activeUsers: 0,
    inputTokens: 0,
    outputTokens: 0
  });
  const [costTrend, setCostTrend] = useState({ 
    current: 0,
    previous: 0,
    change: 0,
    isIncrease: false
  });
  
  const router = useRouter();
  const supabase = createClient();

  // Check if current user is an admin
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
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();
          
        if (userDataError || !userData?.is_admin) {
          setIsAdmin(false);
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        
        // Fetch usage data
        await loadUsageData(selectedTimeframe);
        
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  const loadUsageData = async (timeframe: string) => {
    setIsLoading(true);
    
    try {
      // Fetch real usage data from adminUtils
      const { totalStats, timeSeriesData, userStats } = await fetchUsageData(timeframe);
      
      setTotalStats({
        ...totalStats,
        inputTokens: 0, // Initialize if not provided by the API
        outputTokens: 0 // Initialize if not provided by the API
      });
      setTimeSeriesData(timeSeriesData);
      setUserStats(userStats);
      
      // Calculate cost trends
      if (timeSeriesData.length > 0) {
        const midpoint = Math.floor(timeSeriesData.length / 2);
        const currentPeriod = timeSeriesData.slice(midpoint);
        const previousPeriod = timeSeriesData.slice(0, midpoint);
        
        const currentCost = currentPeriod.reduce((sum, day) => sum + day.costs, 0);
        const previousCost = previousPeriod.reduce((sum, day) => sum + day.costs, 0);
        const costChange = previousCost > 0 ? (currentCost - previousCost) / previousCost * 100 : 0;
        
        setCostTrend({
          current: currentCost,
          previous: previousCost,
          change: Math.abs(costChange),
          isIncrease: costChange > 0
        });
      }
      
      // Create token distribution using actual input and output token data
      const totalTokens = totalStats.tokens;
      const inputTokens = totalStats.inputTokens || 0;
      const outputTokens = totalStats.outputTokens || 0;
      
      // If we don't have a breaksadown, estimate based on typical patterns
      const inputTokenCount = inputTokens || Math.round(totalTokens * 0.3);
      const outputTokenCount = outputTokens || Math.round(totalTokens * 0.7);
      
      const tokenDist = [
        { 
          type: 'Input Tokens', 
          tokens: inputTokenCount,
          percentage: Math.round((inputTokenCount / totalTokens) * 100) || 0
        },
        { 
          type: 'Output Tokens', 
          tokens: outputTokenCount,
          percentage: Math.round((outputTokenCount / totalTokens) * 100) || 0
        }
      ];
      
      setTokenDistribution(tokenDist);
      
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast.error("Failed to fetch usage data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate time series data for chart
  const generateTimeSeriesData = () => {
    return {
      labels: timeSeriesData.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Daily Cost ($)',
          data: timeSeriesData.map(entry => entry.costs),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ]
    };
  };
  
  // Generate token usage data for chart
  const generateTokenUsageData = () => {
    return {
      labels: timeSeriesData.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Tokens Used',
          data: timeSeriesData.map(entry => entry.tokens),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ]
    };
  };
  
  // Generate token distribution data for pie chart
  const generateTokenDistributionData = () => {
    return {
      labels: tokenDistribution.map(item => item.type),
      datasets: [
        {
          data: tokenDistribution.map(item => item.tokens),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)', // Input tokens - blue
            'rgba(16, 185, 129, 0.7)', // Output tokens - green
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
          ],
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    loadUsageData(timeframe);
  };
  
  // Handle model filter change
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    // In a real app, would refetch data filtered by model
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
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground">Analyze usage patterns and costs across your organization</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem>CSV (.csv)</DropdownMenuItem>
                <DropdownMenuItem>PDF Report (.pdf)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Button 
            variant={selectedTimeframe === '7d' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleTimeframeChange('7d')}
          >
            7 days
          </Button>
          <Button 
            variant={selectedTimeframe === '30d' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleTimeframeChange('30d')}
          >
            30 days
          </Button>
          <Button 
            variant={selectedTimeframe === '90d' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleTimeframeChange('90d')}
          >
            90 days
          </Button>
          <Button 
            variant={selectedTimeframe === '180d' ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleTimeframeChange('180d')}
          >
            180 days
          </Button>
        </div>

        {/* Cost trend summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Cost</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-bold">
                  ${totalStats.costs.toFixed(2)}
                </CardTitle>
                <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className={`flex items-center space-x-1 text-xs ${costTrend.isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                {costTrend.isIncrease ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>{costTrend.change.toFixed(1)}% from previous period</span>
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tokens</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-bold">
                  {totalStats.tokens.toLocaleString()}
                </CardTitle>
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-xs text-muted-foreground">
                Active users: {totalStats.activeUsers}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Interactions</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-3xl font-bold">
                  {totalStats.interactions.toLocaleString()}
                </CardTitle>
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-xs text-muted-foreground">
                {totalStats.errors} errors ({((totalStats.errors / Math.max(totalStats.interactions, 1)) * 100).toFixed(1)}%)
              </div>
            </CardHeader>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Cost Over Time</CardTitle>
              <CardDescription>
                Daily cost for the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line 
                  data={generateTimeSeriesData()} 
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
                            const dataIndex = context.dataIndex;
                            const day = timeSeriesData[dataIndex] || { tokens: 0, interactions: 0 };
                            return [
                              `Cost: $${context.raw}`,
                              `Tokens: ${day.tokens.toLocaleString()}`,
                              `Interactions: ${day.interactions}`
                            ];
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
              <CardDescription>
                Breakdown of input vs output tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Pie 
                  data={generateTokenDistributionData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const dataPoint = tokenDistribution[context.dataIndex];
                            return `${dataPoint.type}: ${dataPoint.tokens.toLocaleString()} (${dataPoint.percentage}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                {tokenDistribution.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ 
                          backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(16, 185, 129, 0.7)'
                        }} 
                      />
                      <span>{item.type}</span>
                    </div>
                    <span className="font-medium">{item.tokens.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total Tokens</span>
                  <span>{totalStats.tokens.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Users by Usage</CardTitle>
            <CardDescription>
              Users with the highest usage in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <div className="grid grid-cols-5 border-b p-3 bg-gray-50">
                <div>User</div>
                <div className="text-right">Interactions</div>
                <div className="text-right">Tokens</div>
                <div className="text-right">Cost</div>
                <div className="text-right">% of Total</div>
              </div>
              
              <div>
                {userStats.slice(0, 5).map((user, index) => {
                  const totalCost = totalStats.costs;
                  const percentage = totalCost > 0 ? (user.costs / totalCost) * 100 : 0;
                  
                  return (
                    <div key={index} className="grid grid-cols-5 p-3 border-b">
                      <div>
                        <div className="font-medium">{user.fullName || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{user.email || `User ID: ${user.userId}`}</div>
                      </div>
                      <div className="text-right">{user.interactions}</div>
                      <div className="text-right">{user.tokens?.toLocaleString() || 0}</div>
                      <div className="text-right">${user.costs?.toFixed(2) || '0.00'}</div>
                      <div className="text-right">{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/user-usage')}>View All Users</Button>
          </CardFooter>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Token Usage Over Time</CardTitle>
            <CardDescription>
              Daily token usage for the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={generateTokenUsageData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Token Usage'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const dataIndex = context.dataIndex;
                          const day = timeSeriesData[dataIndex] || { costs: 0, activeUsers: 0 };
                          return [
                            `Tokens: ${context.raw}`,
                            `Cost: $${day.costs.toFixed(2)}`,
                            `Active Users: ${day.activeUsers}`
                          ];
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
