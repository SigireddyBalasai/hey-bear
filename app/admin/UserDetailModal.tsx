"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend 
} from 'chart.js';
import { Line, Doughnut } from "react-chartjs-2";
import { 
  MessageSquare, 
  Clock, 
  Zap, 
  User, 
  Mail, 
  Calendar, 
  FileSpreadsheet, 
  Shield,
  Trash2,
  MoveRight,
  ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { fetchUserInteractions } from "./utils/adminUtils";
import { Tables } from "@/lib/db.types";

// Register Chart.js components - add this
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

export function UserDetailModal({ isOpen, onClose, userData }: UserDetailModalProps) {
  const [userInteractions, setUserInteractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen && userData?.userId) {
      setIsLoading(true);
      fetchUserInteractions(userData.userId, 100).then(interactions => {
        setUserInteractions(interactions);
        setIsLoading(false);
      });
    }
  }, [isOpen, userData]);
  
  // Generate time series data for user based on actual interactions
  const generateTimeSeriesData = () => {
    // Group interactions by day
    const daysMap = new Map<string, number>();
    const last14Days = [...Array(14)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date.toISOString().split('T')[0];
    });
    
    // Initialize all days with 0
    last14Days.forEach(day => {
      daysMap.set(day, 0);
    });
    
    // Count interactions per day
    userInteractions.forEach(interaction => {
      if (interaction.interaction_time) {
        const day = interaction.interaction_time.split('T')[0];
        if (daysMap.has(day)) {
          daysMap.set(day, (daysMap.get(day) || 0) + 1);
        }
      }
    });
    
    // Format for chart.js
    return {
      labels: last14Days.map(day => {
        const date = new Date(day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Messages',
          data: last14Days.map(day => daysMap.get(day) || 0),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
        }
      ],
    };
  };

  // Generate token usage breakdown using actual input/output tokens
  const generateTokenUsageData = () => {
    // Calculate total input and output tokens
    let inputTokens = 0;
    let outputTokens = 0;
    
    userInteractions.forEach(interaction => {
      inputTokens += interaction.input_tokens || 0;
      outputTokens += interaction.output_tokens || 0;
    });
    
    // If no data available, use userData or estimates
    if (inputTokens === 0 && outputTokens === 0) {
      const totalTokens = userData.token_usage || 0;
      inputTokens = userData.inputTokens || Math.round(totalTokens * 0.3);
      outputTokens = userData.outputTokens || Math.round(totalTokens * 0.7);
    }
    
    return {
      labels: ['Input Tokens', 'Output Tokens'],
      datasets: [
        {
          data: [inputTokens, outputTokens],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
      legend: {
        position: 'top' as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toLocaleString()} tokens (${percentage}%)`;
          }
        }
      }
    },
  };

  // Generate token breakdown data for user
  const generateTokenBreakdownData = () => {
    // Use actual data if available, otherwise create a sensible estimate
    const totalTokens = userData.token_usage || 0;
    const inputTokens = userData.input_tokens || Math.round(totalTokens * 0.3);
    const outputTokens = userData.output_tokens || Math.round(totalTokens * 0.7);
    
    return {
      labels: ['Input Tokens', 'Output Tokens'],
      datasets: [
        {
          data: [inputTokens, outputTokens],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  // Sample activity logs
  const activityLogs = [
    { 
      id: 1, 
      action: "Created Assistant", 
      description: "Created a new assistant named 'Research Helper'",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString() 
    },
    { 
      id: 2, 
      action: "Chat Session", 
      description: "Started a new chat session with 'Research Helper'",
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    { 
      id: 3, 
      action: "Updated Profile", 
      description: "Updated account preferences",
      timestamp: new Date().toISOString()
    }
  ];

  // Sample assistant data
  const userAssistants = [
    { 
      id: 1, 
      name: "Research Helper", 
      description: "Helps with academic research and citations",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      messages: 86
    },
    { 
      id: 2, 
      name: "Code Reviewer", 
      description: "Reviews code and suggests improvements",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      messages: 42
    }
  ];

  // Get initials for avatar
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'UN';
  };

  if (!userData) return null;

  // Format date nicely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate user token stats
  const calculateTokenStats = () => {
    const stats = {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0
    };
    
    // If we have interactions data, use it
    if (userInteractions.length > 0) {
      stats.totalTokens = userInteractions.reduce((sum, i) => sum + (i.token_usage || 0), 0);
      stats.inputTokens = userInteractions.reduce((sum, i) => sum + (i.input_tokens || 0), 0);
      stats.outputTokens = userInteractions.reduce((sum, i) => sum + (i.output_tokens || 0), 0);
    } else {
      // Fall back to userData or estimates
      stats.totalTokens = userData.token_usage || 0;
      stats.inputTokens = userData.inputTokens || Math.round(stats.totalTokens * 0.3);
      stats.outputTokens = userData.outputTokens || Math.round(stats.totalTokens * 0.7);
    }
    
    return stats;
  };
  
  const tokenStats = calculateTokenStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={userData.users?.full_name || "User"} />
              <AvatarFallback>{getInitials(userData.users?.full_name)}</AvatarFallback>
            </Avatar>
            {userData.users?.full_name || "User"} 
            <Badge variant="outline" className="ml-2">User</Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {userData.users?.email || "No email"}
            <span className="mx-2">•</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Member since {formatDate(userData.users?.created_at || userData.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription>Messages Sent</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{userData.message_count || 0}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription>Token Usage</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{userData.token_usage?.toLocaleString() || 0}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription>First Seen</CardDescription>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {new Date(userData.users?.created_at || userData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="usage" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="assistants">Assistants</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="usage" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message Usage (Last 14 days)</CardTitle>
                  <CardDescription>
                    Number of messages sent by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p>Loading interaction data...</p>
                      </div>
                    ) : (
                      <Line data={generateTimeSeriesData()} options={lineChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Token Usage Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of input vs output tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p>Loading token data...</p>
                      </div>
                    ) : (
                      <Doughnut data={generateTokenUsageData()} options={doughnutOptions} />
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"/>
                        <span>Input Tokens</span>
                      </div>
                      <span>{tokenStats.inputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-teal-400 mr-2"/>
                        <span>Output Tokens</span>
                      </div>
                      <span>{tokenStats.outputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t">
                      <span>Total Tokens</span>
                      <span>{tokenStats.totalTokens.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown of resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Last 7 Days</TableHead>
                      <TableHead>Last 30 Days</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Messages Sent</TableCell>
                      <TableCell>{Math.floor(userData.message_count * 0.3) || 0}</TableCell>
                      <TableCell>{Math.floor(userData.message_count * 0.8) || 0}</TableCell>
                      <TableCell>{userData.message_count || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tokens Used</TableCell>
                      <TableCell>{Math.floor((userData.token_usage || 0) * 0.3).toLocaleString()}</TableCell>
                      <TableCell>{Math.floor((userData.token_usage || 0) * 0.8).toLocaleString()}</TableCell>
                      <TableCell>{(userData.token_usage || 0).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">API Calls</TableCell>
                      <TableCell>{Math.floor((userData.message_count || 0) * 1.5)}</TableCell>
                      <TableCell>{Math.floor((userData.message_count || 0) * 4)}</TableCell>
                      <TableCell>{Math.floor((userData.message_count || 0) * 5)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assistants">
            {userAssistants.length > 0 ? (
              <div className="space-y-4">
                {userAssistants.map(assistant => (
                  <Card key={assistant.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{assistant.name}</CardTitle>
                          <CardDescription className="mt-1">{assistant.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{assistant.messages} messages</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Created on {formatDate(assistant.created_at)}
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between">
                      <Button variant="outline" size="sm" className="gap-1">
                        <MoveRight className="h-4 w-4" /> View Assistant
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader className="text-center pb-2">
                  <CardTitle>No Assistants</CardTitle>
                  <CardDescription>
                    This user hasn't created any assistants yet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <Shield className="h-20 w-20 text-muted-foreground/30" />
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Activity Logs</CardTitle>
                  <CardDescription>
                    Recent user activity and events
                  </CardDescription>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ListFilter className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {activityLogs.length > 0 ? (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex flex-col space-y-1 border-b pb-4 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(log.timestamp).toLocaleDateString('en-US', {
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity logs available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="text-blue-600 border-blue-600">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button>
              <User className="mr-2 h-4 w-4" />
              View Full Profile
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
