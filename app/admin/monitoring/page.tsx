"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '../../Concierge/Loading';
import { 
  BarChart3,
  AlertTriangle,
  Clock,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  Terminal,
  RotateCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '../AdminSidebar';
import { AdminHeader } from '../AdminHeader';
import { RealTimeMonitor } from '../RealTimeMonitor';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  lastIncident?: string;
  uptime: number;
  responseTime: number;
}

export default function MonitoringPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  
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
        
        // Generate dummy service statuses
        const dummyStatuses: ServiceStatus[] = [
          {
            name: 'API Gateway',
            status: 'operational',
            uptime: 99.99,
            responseTime: 145,
          },
          {
            name: 'Authentication Service',
            status: 'operational',
            uptime: 99.97,
            responseTime: 89,
          },
          {
            name: 'Database Cluster',
            status: 'operational',
            uptime: 99.95,
            responseTime: 12,
          },
          {
            name: 'AI Model Service',
            status: 'degraded',
            lastIncident: '2 hours ago',
            uptime: 98.45,
            responseTime: 312,
          },
          {
            name: 'File Storage',
            status: 'operational',
            uptime: 99.98,
            responseTime: 65,
          },
        ];
        
        setServiceStatuses(dummyStatuses);

        // Generate mock system logs
        const mockLogs = [
          `[${new Date().toISOString()}] INFO: System startup complete`,
          `[${new Date().toISOString()}] INFO: Authenticated 35 users in the last 10 minutes`,
          `[${new Date().toISOString()}] WARN: High CPU usage detected on ML node 3 (82%)`,
          `[${new Date(Date.now() - 5 * 60000).toISOString()}] INFO: Database backup completed successfully`,
          `[${new Date(Date.now() - 10 * 60000).toISOString()}] ERROR: Rate limit exceeded for API key API123456`,
          `[${new Date(Date.now() - 15 * 60000).toISOString()}] WARN: Memory usage approaching threshold (78%)`,
          `[${new Date(Date.now() - 20 * 60000).toISOString()}] INFO: New model version deployed: claude-3-opus-20240229`,
          `[${new Date(Date.now() - 30 * 60000).toISOString()}] ERROR: Failed to connect to secondary database node`,
          `[${new Date(Date.now() - 35 * 60000).toISOString()}] INFO: Scheduled maintenance completed`,
          `[${new Date(Date.now() - 60 * 60000).toISOString()}] WARN: Token usage spike detected for user ID 45921`,
        ];

        setSystemLogs(mockLogs);
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Handle interval change
  const handleIntervalChange = (value: string) => {
    setRefreshInterval(parseInt(value, 10));
  };
  
  // Manual refresh handler
  const handleManualRefresh = () => {
    toast("Refreshing", {
      description: "Manually refreshing all monitoring data",
    });
    
    // This would trigger an actual refresh in a real app
    // For now, just add some variation to the service statuses
    setServiceStatuses(prev => {
      return prev.map(service => ({
        ...service,
        responseTime: service.responseTime + Math.floor(Math.random() * 20 - 10),
        status: Math.random() > 0.9 ? 
          (service.status === 'operational' ? 'degraded' : 'operational') : 
          service.status
      }));
    });

    // Add new log entry
    setSystemLogs(prev => {
      const newLog = `[${new Date().toISOString()}] INFO: Manual refresh triggered by admin`;
      return [newLog, ...prev];
    });
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

  // Get overall system status
  const overallStatus = serviceStatuses.some(s => s.status === 'outage') ? 'outage' :
    serviceStatuses.some(s => s.status === 'degraded') ? 'degraded' : 'operational';

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        <AdminHeader user={user} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">System Monitoring</h1>
            <p className="text-muted-foreground">Real-time monitoring and system status</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={refreshInterval.toString()} onValueChange={handleIntervalChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Refresh Interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">Refresh: 1 sec</SelectItem>
                <SelectItem value="5000">Refresh: 5 sec</SelectItem>
                <SelectItem value="15000">Refresh: 15 sec</SelectItem>
                <SelectItem value="30000">Refresh: 30 sec</SelectItem>
                <SelectItem value="60000">Refresh: 60 sec</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh Now
            </Button>
            
            <Badge 
              variant={
                overallStatus === 'operational' ? 'outline' : 
                overallStatus === 'degraded' ? 'secondary' : 'destructive'
              }
              className="ml-2 px-3 py-1"
            >
              {overallStatus === 'operational' ? (
                <><CheckCircle className="mr-1 h-4 w-4" /> All Systems Operational</>
              ) : overallStatus === 'degraded' ? (
                <><AlertTriangle className="mr-1 h-4 w-4" /> Degraded Performance</>
              ) : (
                <><XCircle className="mr-1 h-4 w-4" /> Service Disruption</>
              )}
            </Badge>
          </div>
        </div>
        
        <div className="mb-8">
          <RealTimeMonitor refreshInterval={refreshInterval} />
        </div>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>
                Current status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Incident</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceStatuses.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                          {service.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            service.status === 'operational' ? 'outline' : 
                            service.status === 'degraded' ? 'secondary' : 'destructive'
                          }
                          className="px-2 py-0.5"
                        >
                          {service.status === 'operational' ? (
                            <>Operational</>
                          ) : service.status === 'degraded' ? (
                            <>Degraded</>
                          ) : (
                            <>Outage</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={service.uptime < 99 ? 'text-amber-600' : 'text-green-600'}>
                          {service.uptime}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={service.responseTime > 200 ? 'text-amber-600' : 'text-muted-foreground'}>
                          {service.responseTime}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        {service.lastIncident ? (
                          <span className="text-muted-foreground">{service.lastIncident}</span>
                        ) : (
                          <span className="text-green-600">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t py-3">
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Monitoring {serviceStatuses.length} services</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">AI Model Service Degraded</span>
                    <Badge variant="outline">2 hours ago</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Increased latency observed in AI model responses due to high traffic volume.
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Database Connectivity Issues</span>
                    <Badge variant="outline">Yesterday</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Brief connectivity issues with the database caused intermittent errors. Resolved within 5 minutes.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Incidents
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">System Logs</CardTitle>
                <CardDescription>Recent system activity</CardDescription>
              </div>
              <Button variant="ghost" size="icon" title="Refresh logs">
                <RotateCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] px-4">
                <div className="font-mono text-xs">
                  {systemLogs.map((log, index) => {
                    const isError = log.includes('ERROR');
                    const isWarning = log.includes('WARN');
                    return (
                      <div 
                        key={index} 
                        className={`py-2 border-b last:border-0 ${
                          isError ? 'text-red-500' : 
                          isWarning ? 'text-amber-500' : 
                          'text-muted-foreground'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t py-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Showing latest logs</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  Download Logs
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
