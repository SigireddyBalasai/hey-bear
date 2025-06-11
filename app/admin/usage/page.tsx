'use client';

import { useCallback, useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';

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
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CircleDollarSign,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { fetchUsageData } from '@/components/admin/utils/adminUtils';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAdminAuth } from '@/hooks/useAuth';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

interface UserStat {
  userId: string;
  interactions: number;
  tokens: number;
  costs: number;
  lastActive: string | null;
  email?: string;
  fullName?: string;
  inputTokens: number;
  outputTokens: number;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  activeUsers: number;
  errors: number;
}

export default function UsageAnalyticsPage() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedAssistant, setSelectedAssistant] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [assistants, setAssistants] = useState<Array<{ id: string; name: string }>>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [tokenDistribution, setTokenDistribution] = useState<
    Array<{ type: string; tokens: number; percentage: number }>
  >([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [totalStats, setTotalStats] = useState({
    interactions: 0,
    tokens: 0,
    costs: 0,
    errors: 0,
    activeUsers: 0,
    inputTokens: 0,
    outputTokens: 0,
  });
  const [costTrend, setCostTrend] = useState({
    current: 0,
    previous: 0,
    change: 0,
    isIncrease: false,
  });

  const supabase = createClient();

  const loadUsageData = useCallback(
    async (
      timeframe: string,
      assistantId: string = selectedAssistant,
      plan: string = selectedPlan
    ) => {
      await withErrorHandling(
        async () => {
          const { totalStats, timeSeriesData, userStats } = await fetchUsageData(
            timeframe,
            assistantId,
            plan
          );

          setTotalStats(totalStats);
          setTimeSeriesData(timeSeriesData);

          // Calculate percentage for each user stat
          const userStatsWithPercentage = userStats.map(user => ({
            ...user,
            email: user.email || '',
            fullName: user.fullName || '',
            percentage: totalStats.costs > 0 ? (user.costs / totalStats.costs) * 100 : 0,
          }));
          setUserStats(userStatsWithPercentage);

          if (timeSeriesData.length > 0) {
            const midpoint = Math.floor(timeSeriesData.length / 2);
            const currentPeriod = timeSeriesData.slice(midpoint);
            const previousPeriod = timeSeriesData.slice(0, midpoint);

            const currentCost = currentPeriod.reduce((sum, day) => sum + day.costs, 0);
            const previousCost = previousPeriod.reduce((sum, day) => sum + day.costs, 0);
            const costChange =
              previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

            setCostTrend({
              current: currentCost,
              previous: previousCost,
              change: Math.abs(costChange),
              isIncrease: costChange > 0,
            });
          }

          const tokenDist = [
            {
              type: 'Input Tokens',
              tokens: totalStats.inputTokens,
              percentage: Math.round((totalStats.inputTokens / totalStats.tokens) * 100) || 0,
            },
            {
              type: 'Output Tokens',
              tokens: totalStats.outputTokens,
              percentage: Math.round((totalStats.outputTokens / totalStats.tokens) * 100) || 0,
            },
          ];

          setTokenDistribution(tokenDist);
        },
        {
          toastTitle: 'Failed to fetch usage data',
          fallbackMessage: 'Unable to load usage analytics data',
        }
      );
    },
    [selectedAssistant, selectedPlan]
  );

  // Load data when admin auth is complete
  useEffect(() => {
    if (!isLoading && isAdmin && user) {
      const fetchAssistants = async () => {
        await withErrorHandling(
          async () => {
            const { data: assistantData } = await supabase
              .from('assistants')
              .select('id, name')
              .eq('pending', false);

            setAssistants(assistantData ?? []);
            await loadUsageData(selectedTimeframe);
          },
          {
            toastTitle: 'Failed to fetch assistants data',
            fallbackMessage: 'Unable to load assistants list',
          }
        );
      };

      void fetchAssistants();
    }
  }, [isLoading, isAdmin, user, selectedTimeframe, loadUsageData, supabase]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    void loadUsageData(timeframe);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    void loadUsageData(selectedTimeframe);
  };

  const handleAssistantChange = (assistant: string) => {
    setSelectedAssistant(assistant);
    void loadUsageData(selectedTimeframe, assistant);
  };

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    void loadUsageData(selectedTimeframe, selectedAssistant, plan);
  };

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
        },
      ],
    };
  };

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
        },
      ],
    };
  };

  const generateTokenDistributionData = () => {
    return {
      labels: tokenDistribution.map(item => item.type),
      datasets: [
        {
          data: tokenDistribution.map(item => item.tokens),
          backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
          borderWidth: 1,
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

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground">
              Analyze usage patterns and costs across your organization
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={selectedAssistant} onValueChange={handleAssistantChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Assistants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assistants</SelectItem>
                {assistants.map(assistant => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlan} onValueChange={handlePlanChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

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
            variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              handleTimeframeChange('7d');
            }}
          >
            7 days
          </Button>
          <Button
            variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              handleTimeframeChange('30d');
            }}
          >
            30 days
          </Button>
          <Button
            variant={selectedTimeframe === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              handleTimeframeChange('90d');
            }}
          >
            90 days
          </Button>
          <Button
            variant={selectedTimeframe === '180d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              handleTimeframeChange('180d');
            }}
          >
            180 days
          </Button>
        </div>

        {/* Cost trend summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Cost</CardDescription>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold">${totalStats.costs.toFixed(2)}</CardTitle>
                <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <div
                className={`flex items-center space-x-1 text-xs ${costTrend.isIncrease ? 'text-red-600' : 'text-green-600'}`}
              >
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
              <div className="flex items-center justify-between">
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl font-bold">
                  {totalStats.interactions.toLocaleString()}
                </CardTitle>
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-xs text-muted-foreground">
                {totalStats.errors} errors (
                {((totalStats.errors / Math.max(totalStats.interactions, 1)) * 100).toFixed(1)}%)
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Cost Over Time</CardTitle>
              <CardDescription>Daily cost for the selected time period</CardDescription>
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
                          callback: function (value) {
                            return '$' + String(value);
                          },
                        },
                      },
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const dataIndex = context.dataIndex;
                            const day = timeSeriesData[dataIndex] || { tokens: 0, interactions: 0 };
                            return [
                              `Cost: $${Number(context.raw).toFixed(2)}`,
                              `Tokens: ${day.tokens.toLocaleString()}`,
                              `Interactions: ${String(day.interactions)}`,
                            ];
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
              <CardDescription>Breakdown of input vs output tokens</CardDescription>
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
                          label: function (context) {
                            const dataPoint = tokenDistribution[context.dataIndex];
                            return `${dataPoint.type}: ${String(dataPoint.tokens.toLocaleString())} (${String(dataPoint.percentage)}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {tokenDistribution.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <div
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            index === 0 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(16, 185, 129, 0.7)',
                        }}
                      />
                      <span>{item.type}</span>
                    </div>
                    <span className="font-medium">
                      {item.tokens.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 text-sm font-semibold">
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
            <CardDescription>Users with the highest usage in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-5 border-b bg-gray-50 p-3">
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
                    <div key={index} className="grid grid-cols-5 border-b p-3">
                      <div>
                        <div className="font-medium">{user.fullName || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || `User ID: ${String(user.userId)}`}
                        </div>
                      </div>
                      <div className="text-right">{user.interactions}</div>
                      <div className="text-right">{user.tokens.toLocaleString()}</div>
                      <div className="text-right">${user.costs.toFixed(2)}</div>
                      <div className="text-right">{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/admin/user-usage';
              }}
            >
              View All Users
            </Button>
          </CardFooter>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Token Usage Over Time</CardTitle>
            <CardDescription>Daily token usage for the selected time period</CardDescription>
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
                        text: 'Token Usage',
                      },
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const dataIndex = context.dataIndex;
                          const day = timeSeriesData[dataIndex] || { costs: 0, activeUsers: 0 };
                          return [
                            `Tokens: ${String(context.raw)}`,
                            `Cost: $${day.costs.toFixed(2)}`,
                            `Active Users: ${String(day.activeUsers)}`,
                          ];
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
