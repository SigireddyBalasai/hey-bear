'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

import type { ChartData, ChartOptions } from 'chart.js';
import { ActivitySquare, AlertTriangle, RefreshCw } from 'lucide-react';

import { fetchSystemMetrics } from '@/components/admin/utils/adminUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RealTimeMonitorProps {
  refreshInterval?: number;
  initialIsMonitoring?: boolean;
}

interface SystemStats {
  timestamp: Date;
  apiLatency: number;
  apiErrors: number;
  apiRequests: number;
  messageCount: number;
  tokenCount: number;
  cpuUsage: number;
  memoryUsage: number;
}

type HealthStatus = 'healthy' | 'warning' | 'degraded';

export function RealTimeMonitor({
  refreshInterval = 5000,
  initialIsMonitoring = true,
}: RealTimeMonitorProps) {
  const [isMonitoring, setIsMonitoring] = useState(initialIsMonitoring);
  const [stats, setStats] = useState<SystemStats[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentTab, setCurrentTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');

  // Convert real metrics to chart data format
  const convertMetricsToStats = useCallback(
    (metrics: {
      activeUsers: number;
      totalRequests: number;
      totalTokens: number;
      errorRate: number;
      hourlyMetrics: {
        timestamp: string;
        requests: number;
        tokens: number;
        errors: number;
        avgLatency: number;
      }[];
    }): SystemStats[] => {
      return metrics.hourlyMetrics.map(metric => ({
        timestamp: new Date(metric.timestamp),
        apiLatency: metric.avgLatency,
        apiErrors: metric.errors,
        apiRequests: metric.requests,
        messageCount: Math.floor(metric.requests * 0.3), // Estimate messages as 30% of requests
        tokenCount: metric.tokens,
        cpuUsage: Math.min(50 + metric.requests * 0.5, 95), // Estimate CPU based on load
        memoryUsage: Math.min(40 + metric.tokens * 0.01, 90), // Estimate memory based on tokens
      }));
    },
    []
  );

  // Fetch real data from the database
  const fetchRealData = useCallback(async () => {
    try {
      const metrics = await fetchSystemMetrics();
      const newStats = convertMetricsToStats(metrics);

      if (newStats.length > 0) {
        setStats(newStats);

        // Update alerts count based on real errors
        const totalErrors = newStats.reduce((sum, stat) => sum + stat.apiErrors, 0);
        setAlertsCount(totalErrors);

        // Update health status based on real metrics
        const avgLatency =
          newStats.reduce((sum, stat) => sum + stat.apiLatency, 0) / newStats.length;
        const avgErrorRate = metrics.errorRate;

        let newStatus: HealthStatus = 'healthy';
        if (avgLatency > 300 || avgErrorRate > 0.1) {
          newStatus = 'degraded';
        } else if (avgLatency > 200 || avgErrorRate > 0.05) {
          newStatus = 'warning';
        }
        setHealthStatus(newStatus);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      // Fallback to basic mock data if database fails
      const fallbackStat: SystemStats = {
        timestamp: new Date(),
        apiLatency: 150,
        apiErrors: 0,
        apiRequests: 10,
        messageCount: 3,
        tokenCount: 1000,
        cpuUsage: 25,
        memoryUsage: 45,
      };
      setStats(prev => [...prev.slice(-29), fallbackStat]);
      setLastUpdated(new Date());
    }
  }, [convertMetricsToStats]);

  // Initialize with real data
  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]);

  // Real-time data fetching
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(fetchRealData, refreshInterval);
    return () => {
      clearInterval(interval);
    };
  }, [isMonitoring, refreshInterval, fetchRealData]);

  const handleToggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  const handleRefreshData = useCallback(() => {
    fetchRealData();
  }, [fetchRealData]);

  // Memoize chart data & options to prevent unnecessary recalculations
  const apiChartData = useMemo<ChartData<'line'>>(
    () => ({
      labels: stats.map(stat => stat.timestamp.toLocaleTimeString()),
      datasets: [
        {
          label: 'API Latency (ms)',
          data: stats.map(stat => stat.apiLatency),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
          yAxisID: 'y1',
        },
        {
          label: 'API Requests',
          data: stats.map(stat => stat.apiRequests),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'API Errors',
          data: stats.map(stat => stat.apiErrors),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.3,
          yAxisID: 'y',
        },
      ],
    }),
    [stats]
  );

  const apiChartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time',
          },
        },
        y: {
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Count',
          },
        },
        y1: {
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Latency (ms)',
          },
        },
      },
    }),
    []
  );

  const messageChartData = useMemo<ChartData<'line'>>(
    () => ({
      labels: stats.map(stat => stat.timestamp.toLocaleTimeString()),
      datasets: [
        {
          label: 'Message Count',
          data: stats.map(stat => stat.messageCount),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          tension: 0.3,
          yAxisID: 'y',
        },
        {
          label: 'Token Count',
          data: stats.map(stat => stat.tokenCount / 100), // Scaled for visibility
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.5)',
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    }),
    [stats]
  );

  const messageChartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Message Count',
          },
        },
        y1: {
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'Token Count (hundreds)',
          },
        },
      },
    }),
    []
  );

  const systemChartData = useMemo<ChartData<'line'>>(
    () => ({
      labels: stats.map(stat => stat.timestamp.toLocaleTimeString()),
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: stats.map(stat => stat.cpuUsage),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Memory Usage (%)',
          data: stats.map(stat => stat.memoryUsage),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          tension: 0.3,
        },
      ],
    }),
    [stats]
  );

  const systemChartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
        },
      },
    }),
    []
  );

  // Get the latest stats - memoize to prevent recalculation on every render
  const latestStats = useMemo(
    () =>
      stats.at(-1) || {
        apiLatency: 0,
        apiErrors: 0,
        apiRequests: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      },
    [stats]
  );

  // Calculate total requests per minute (last ~60 seconds worth of data)
  const totalRequestsPerMin = useMemo(
    () => stats.slice(-12).reduce((sum, item) => sum + item.apiRequests, 0),
    [stats]
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">System Monitor</CardTitle>
          <CardDescription>Real-time system performance and usage metrics</CardDescription>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isMonitoring}
              onCheckedChange={handleToggleMonitoring}
              id="monitoring-toggle"
            />
            <Label htmlFor="monitoring-toggle" className="text-sm">
              {isMonitoring ? 'Monitoring On' : 'Monitoring Off'}
            </Label>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshData}
            disabled={isMonitoring}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Badge
            variant={
              healthStatus === 'healthy'
                ? 'outline'
                : healthStatus === 'warning'
                  ? 'secondary'
                  : 'destructive'
            }
            className="ml-2"
          >
            {healthStatus === 'healthy'
              ? 'System Healthy'
              : healthStatus === 'warning'
                ? 'Performance Warning'
                : 'Performance Degraded'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">API Latency</span>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold">{Math.round(latestStats.apiLatency)}</span>
              <span className="ml-1 text-sm">ms</span>
            </div>
          </div>

          <div className="flex flex-col rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">Requests / min</span>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold">{totalRequestsPerMin}</span>
            </div>
          </div>

          <div className="flex flex-col rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">Error Alerts</span>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold">{alertsCount}</span>
              {alertsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alertsCount} Errors
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-md bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <div className="mt-1 flex items-center">
              <span className="text-sm font-medium">{lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {alertsCount > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>System Alerts</AlertTitle>
            <AlertDescription>
              There are {alertsCount} active API error alerts that need attention.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">API Overview</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="system">System Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="h-[300px]">
              <Line data={apiChartData} options={apiChartOptions} />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="h-[300px]">
              <Line data={messageChartData} options={messageChartOptions} />
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CPU Usage</Label>
                <span className="text-sm">{latestStats.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={latestStats.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Memory Usage</Label>
                <span className="text-sm">{latestStats.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={latestStats.memoryUsage} className="h-2" />
            </div>

            <div className="h-[200px]">
              <Line data={systemChartData} options={systemChartOptions} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivitySquare className="h-3.5 w-3.5" />
            <span>Monitoring interval: {refreshInterval / 1000}s</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Export Data
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAlertsCount(0);
              }}
            >
              Clear Alerts
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
