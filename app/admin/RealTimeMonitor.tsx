"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivitySquare, RefreshCw, AlertTriangle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface RealTimeMonitorProps {
  refreshInterval?: number; // in milliseconds
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

export function RealTimeMonitor({
  refreshInterval = 5000,
  initialIsMonitoring = true
}: RealTimeMonitorProps) {
  const [isMonitoring, setIsMonitoring] = useState(initialIsMonitoring);
  const [stats, setStats] = useState<SystemStats[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentTab, setCurrentTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'degraded'>('healthy');

  // Generate some initial data
  useEffect(() => {
    const initialData = Array.from({ length: 30 }, (_, i) => {
      const timestamp = new Date();
      timestamp.setSeconds(timestamp.getSeconds() - (30 - i) * 5);
      
      return {
        timestamp,
        apiLatency: Math.random() * 300 + 100, // 100-400ms
        apiErrors: Math.floor(Math.random() * 3),
        apiRequests: Math.floor(Math.random() * 30 + 20),
        messageCount: Math.floor(Math.random() * 50 + 10),
        tokenCount: Math.floor(Math.random() * 5000 + 2000),
        cpuUsage: Math.random() * 40 + 10, // 10-50%
        memoryUsage: Math.random() * 30 + 40 // 40-70%
      };
    });
    
    setStats(initialData);
    
    // Count initial alerts
    const errors = initialData.reduce((count, item) => count + item.apiErrors, 0);
    setAlertsCount(errors);
    
    // Set initial health status
    const avgLatency = initialData.reduce((sum, item) => sum + item.apiLatency, 0) / initialData.length;
    const errorRate = errors / initialData.length;
    
    if (avgLatency > 300 || errorRate > 1) {
      setHealthStatus('degraded');
    } else if (avgLatency > 200 || errorRate > 0.5) {
      setHealthStatus('warning');
    } else {
      setHealthStatus('healthy');
    }
  }, []);

  // Simulated data fetching
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(() => {
      const newStat: SystemStats = {
        timestamp: new Date(),
        apiLatency: Math.random() * 300 + 100,
        apiErrors: Math.floor(Math.random() * 3),
        apiRequests: Math.floor(Math.random() * 30 + 20),
        messageCount: Math.floor(Math.random() * 50 + 10),
        tokenCount: Math.floor(Math.random() * 5000 + 2000),
        cpuUsage: Math.random() * 40 + 10,
        memoryUsage: Math.random() * 30 + 40
      };
      
      setStats(prev => {
        // Keep only the last 30 data points
        const newStats = [...prev.slice(-29), newStat];
        
        // Update alerts count
        const errors = newStat.apiErrors;
        if (errors > 0) {
          setAlertsCount(a => a + errors);
        }
        
        // Update health status
        const avgLatency = newStats.reduce((sum, item) => sum + item.apiLatency, 0) / newStats.length;
        const errorRate = newStats.reduce((sum, item) => sum + item.apiErrors, 0) / newStats.length;
        
        if (avgLatency > 300 || errorRate > 1) {
          setHealthStatus('degraded');
        } else if (avgLatency > 200 || errorRate > 0.5) {
          setHealthStatus('warning');
        } else {
          setHealthStatus('healthy');
        }
        
        return newStats;
      });
      
      setLastUpdated(new Date());
    }, refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [isMonitoring, refreshInterval]);

  const handleToggleMonitoring = () => {
    setIsMonitoring(prev => !prev);
  };

  const handleRefreshData = () => {
    // This would trigger an immediate data fetch in a real implementation
    const newStat: SystemStats = {
      timestamp: new Date(),
      apiLatency: Math.random() * 300 + 100,
      apiErrors: Math.floor(Math.random() * 3),
      apiRequests: Math.floor(Math.random() * 30 + 20),
      messageCount: Math.floor(Math.random() * 50 + 10),
      tokenCount: Math.floor(Math.random() * 5000 + 2000),
      cpuUsage: Math.random() * 40 + 10,
      memoryUsage: Math.random() * 30 + 40
    };
    
    setStats(prev => [...prev.slice(-29), newStat]);
    setLastUpdated(new Date());
  };

  // Prepare chart data
  const chartData = {
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
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
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
        position: 'left' as const,
        title: {
          display: true,
          text: 'Count',
        },
      },
      y1: {
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Latency (ms)',
        },
      },
    },
  };
  
  // Get the latest stats
  const latestStats = stats[stats.length - 1] || {
    apiLatency: 0,
    apiErrors: 0,
    apiRequests: 0,
    cpuUsage: 0,
    memoryUsage: 0
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">System Monitor</CardTitle>
          <CardDescription>
            Real-time system performance and usage metrics
          </CardDescription>
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
              healthStatus === 'healthy' ? 'outline' : 
              healthStatus === 'warning' ? 'secondary' : 'destructive'
            }
            className="ml-2"
          >
            {healthStatus === 'healthy' ? 'System Healthy' : 
             healthStatus === 'warning' ? 'Performance Warning' : 'Performance Degraded'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col p-3 bg-muted/30 rounded-md">
            <span className="text-sm text-muted-foreground">API Latency</span>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-bold">{Math.round(latestStats.apiLatency)}</span>
              <span className="text-sm ml-1">ms</span>
            </div>
          </div>
          
          <div className="flex flex-col p-3 bg-muted/30 rounded-md">
            <span className="text-sm text-muted-foreground">Requests / min</span>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-bold">
                {stats.slice(-12).reduce((sum, item) => sum + item.apiRequests, 0)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col p-3 bg-muted/30 rounded-md">
            <span className="text-sm text-muted-foreground">Error Alerts</span>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-bold">{alertsCount}</span>
              {alertsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alertsCount} Errors
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col p-3 bg-muted/30 rounded-md">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <div className="flex items-center mt-1">
              <span className="text-sm font-medium">
                {lastUpdated.toLocaleTimeString()}
              </span>
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
              <Line data={chartData} options={chartOptions} />
            </div>
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-4">
            <div className="h-[300px]">
              <Line 
                data={{
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
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  scales: {
                    y: {
                      display: true,
                      position: 'left' as const,
                      title: {
                        display: true,
                        text: 'Message Count',
                      },
                    },
                    y1: {
                      display: true,
                      position: 'right' as const,
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: 'Token Count (hundreds)',
                      },
                    },
                  },
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>CPU Usage</Label>
                <span className="text-sm">{latestStats.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={latestStats.cpuUsage} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Memory Usage</Label>
                <span className="text-sm">{latestStats.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={latestStats.memoryUsage} className="h-2" />
            </div>
            
            <div className="h-[200px]">
              <Line 
                data={{
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
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                    }
                  }
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ActivitySquare className="h-3.5 w-3.5" />
            <span>Monitoring interval: {refreshInterval / 1000}s</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Export Data
            </Button>
            <Button size="sm" className="h-7 text-xs">
              Clear Alerts
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
