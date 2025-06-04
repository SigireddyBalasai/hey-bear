// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

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
  BarChart3,
  Calendar,
  Clock,
  Download,
  MessageSquare,
  Phone,
  RefreshCw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/client';

import { TwilioMessageDetails } from './TwilioMessageDetails';

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// filepath: /home/balasai/hey-bear/app/admin/components/PhoneNumberStats.tsx

// Register Chart.js components
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

// Format phone number for display
const formatPhoneNumber = (phoneNumber: string) => {
  // Basic formatting for US numbers
  if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
    return `(${phoneNumber.slice(2, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8)}`;
  }
  return phoneNumber;
};

// Format date for display
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Calculate average messages per day for a phone
const getMessagesPerDay = (phone: { total_messages: number; active_days: number }): string => {
  if (!phone.active_days || phone.active_days === 0) return '0';
  return (phone.total_messages / phone.active_days).toFixed(1);
};

function getTimeframeDisplay(timeframe: string): string {
  switch (timeframe) {
    case '7d': {
      return '7 Days';
    }
    case '90d': {
      return '3 Months';
    }
    case '180d': {
      return '6 Months';
    }
    default: {
      return '30 Days';
    }
  }
}

function getTimeframeDescription(timeframe: string): string {
  switch (timeframe) {
    case '7d': {
      return 'the last 7 days';
    }
    case '90d': {
      return 'the last 3 months';
    }
    case '180d': {
      return 'the last 6 months';
    }
    default: {
      return 'the last 30 days';
    }
  }
}

function getTotalDays(timeframe: string): number {
  switch (timeframe) {
    case '7d': {
      return 7;
    }
    case '90d': {
      return 90;
    }
    case '180d': {
      return 180;
    }
    default: {
      return 30;
    }
  }
}

// Helper function to display active days fraction
const getActiveDaysDisplay = (activeDays: number, timeframe: string): string => {
  const totalDays = getTotalDays(timeframe);
  return `${String(activeDays)}/${String(totalDays)}`;
};

// Calculate activity ratio (active days / timeframe days)
const getActivityRatio = (phone: { active_days: number }, currentTimeframe: string): number => {
  const totalDays = getTotalDays(currentTimeframe);
  if (!phone.active_days) return 0;
  return Math.min(100, Math.round((phone.active_days / totalDays) * 100));
};

// Calculate percentage with proper formatting
const calculatePercentage = (value: number, total: number): string => {
  if (!total) return '0';
  return ((value / total) * 100).toFixed(1);
};

// Format last active time
const getLastActiveTime = (lastMessage: string | null | undefined): string => {
  return lastMessage ? formatDate(lastMessage) : 'Never';
};

// Define custom types for interactions
type DatabaseWithInteractions = Database & {
  Tables: {
    interactions: {
      Row: {
        id: string;
        interaction_time: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chat: Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      };
      Insert: {
        interaction_time?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chat?: Record<string, any>;
      };
      Update: {
        interaction_time?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chat?: Record<string, any>;
      };
    };
  };
};

type _InteractionRow = DatabaseWithInteractions['Tables']['interactions']['Row'];

// Update the type to match Supabase's join return type
interface AssistantDetails {
  id: string;
  name: string;
  user_id: string;
}

type _PhoneNumberWithAssistant = Database['public']['Tables']['phone_numbers']['Row'] & {
  assistant: AssistantDetails | null;
};

type PhoneNumberStat = {
  id: string;
  phone_number: string;
  number: string;
  assistant_name?: string;
  assistant?: string | null;
  assistant_id?: string | null;
  user_id?: string | null;
  total_interactions?: number;
  unique_contacts?: number;
  last_interaction?: string;
  is_assigned: boolean;
  messages_sent: number;
  messages_received: number;
  total_messages: number;
  active_days: number;
  unique_users: number;
  first_message?: string | null;
  last_message?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function PhoneNumberStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [phoneStats, setPhoneStats] = useState<PhoneNumberStat[]>([]);
  const [usageSummary, setUsageSummary] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
    totalMessages: 0,
    activePhones: 0,
  });
  const [timeframe, setTimeframe] = useState('30d');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);
  const [isMessageDetailsOpen, setIsMessageDetailsOpen] = useState(false);

  const loadPhoneStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get all phone numbers with assistant details
      const { data: phoneNumbers } = await supabase.from('phone_numbers').select(
        `
          id,
          phone_number,
          is_assigned,
          assistant:assistants (
            id,
            name,
            user_id
          )
        `
      );

      // Calculate basic stats
      const assigned = phoneNumbers?.filter(p => p.is_assigned).length ?? 0;
      const total = phoneNumbers?.length ?? 0;

      // Calculate timeframe based on selection
      const now = new Date();
      const startDate = new Date();

      switch (timeframe) {
        case '7d': {
          startDate.setDate(now.getDate() - 7);
          break;
        }
        case '90d': {
          startDate.setDate(now.getDate() - 90);
          break;
        }
        case '180d': {
          startDate.setDate(now.getDate() - 180);
          break;
        }
        default: {
          // 30d
          startDate.setDate(now.getDate() - 30);
        }
      }

      // Get message interactions for the phone numbers
      const { data: interactions, error: interactionError } = await supabase

        .from('interactions')
        .select('*')
        .gte('interaction_time', startDate.toISOString())
        .contains('chat', 'to');

      if (interactionError) throw interactionError;

      // Process phone usage data
      // Define the phone data structure for better typing
      type PhoneDataType = {
        id: string;
        number: string;
        phone_number: string;
        is_assigned: boolean;
        assistant: string | null;
        assistant_id: string | null;
        user_id: string | null;
        messages_sent: number;
        messages_received: number;
        active_days: Set<string>;
        first_message: string | null;
        last_message: string | null;
        unique_users: Set<string>;
        total_interactions: number;
        unique_contacts: number;
      };

      const phoneData = new Map<string, PhoneDataType>();
      let totalMessages = 0;

      // Initialize phone data
      phoneNumbers?.forEach(phone => {
        // Type assertion to handle Supabase typing issues
        const assistant = phone.assistant as unknown as AssistantDetails | null;

        phoneData.set(phone.phone_number, {
          id: phone.id,
          number: phone.phone_number,
          phone_number: phone.phone_number,
          is_assigned: phone.is_assigned || false, // Ensure non-null boolean
          assistant: assistant?.name ?? null,
          assistant_id: assistant?.id ?? null,
          user_id: assistant?.user_id ?? null,
          messages_sent: 0,
          messages_received: 0,
          active_days: new Set<string>(),
          first_message: null,
          last_message: null,
          unique_users: new Set<string>(),
          total_interactions: 0,
          unique_contacts: 0,
        });
      });

      // Count interactions
      interactions.forEach(interaction => {
        try {
          const chatData = JSON.parse(interaction.chat ?? '') as {
            to?: string;
            from?: string;
            messages_sent?: number;
            messages_received?: number;
            unique_users?: number;
            active_days?: number;
            first_message?: string;
            last_message?: string;
          };
          let phoneNumber = null;

          // Determine phone number from interaction
          if (typeof chatData === 'object') {
            phoneNumber = chatData.to ?? chatData.from;
          }

          if (phoneNumber && phoneData.has(phoneNumber)) {
            const phoneStats = phoneData.get(phoneNumber);
            if (!phoneStats) return;

            totalMessages++;

            // Check if phone sent or received the message
            if (chatData.from === phoneNumber) {
              phoneStats.messages_sent++;
            } else if (chatData.to === phoneNumber) {
              phoneStats.messages_received++;
            }

            // Track unique users
            const user = chatData.from === phoneNumber ? chatData.to : chatData.from;
            if (user) phoneStats.unique_users.add(user);

            // Track active days
            if (interaction.interaction_time) {
              const day = interaction.interaction_time.split('T')[0];
              phoneStats.active_days.add(day);

              // Track first and last message
              if (
                !phoneStats.first_message ||
                interaction.interaction_time < phoneStats.first_message
              ) {
                phoneStats.first_message = interaction.interaction_time;
              }

              if (
                !phoneStats.last_message ||
                interaction.interaction_time > phoneStats.last_message
              ) {
                phoneStats.last_message = interaction.interaction_time;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing chat data:', error);
        }
      });

      // Format phone stats into array and convert sets to numbers
      const finalStats = [...phoneData.values()].map(stats => ({
        ...stats,
        total_messages: Number(stats.messages_sent) + Number(stats.messages_received),
        active_days: Number(stats.active_days.size),
        unique_users: Number(stats.unique_users.size),
      }));

      // Sort by total messages
      finalStats.sort((a, b) => b.total_messages - a.total_messages);

      // Count active phones (phones with at least one message)
      const activePhones = finalStats.filter(p => p.total_messages > 0).length;

      // Update state
      setPhoneStats(finalStats);
      setUsageSummary({
        total,
        assigned,
        unassigned: total - assigned,
        totalMessages,
        activePhones,
      });
    } catch (error) {
      console.error('Error loading phone stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error('Failed to load phone statistics');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, timeframe]);

  // Call loadPhoneStats when timeframe changes
  useEffect(() => {
    void loadPhoneStats();
  }, [timeframe, loadPhoneStats]);

  // Generate data for messages by phone chart
  const generateMessagesChartData = () => {
    // Get top 10 most active phones
    const topPhones = phoneStats.slice(0, 10);

    return {
      labels: topPhones.map(phone => formatPhoneNumber(phone.number)),
      datasets: [
        {
          label: 'Outgoing Messages',
          data: topPhones.map(phone => phone.messages_sent),
          backgroundColor: 'rgba(53, 162, 235, 0.8)',
        },
        {
          label: 'Incoming Messages',
          data: topPhones.map(phone => phone.messages_received),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
        },
      ],
    };
  };

  // Generate data for usage overview chart
  const generateUsageOverviewData = () => {
    return {
      labels: ['Assigned', 'Unassigned'],
      datasets: [
        {
          data: [usageSummary.assigned, usageSummary.unassigned],
          backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(201, 203, 207, 0.8)'],
          borderColor: ['rgb(75, 192, 192)', 'rgb(201, 203, 207)'],
          borderWidth: 1,
        },
      ],
    };
  };

  // Export phone statistics data
  const exportData = () => {
    // Convert phone stats to CSV
    const headers = [
      'Phone Number',
      'Assigned',
      'No-show',
      'Messages Sent',
      'Messages Received',
      'Total Messages',
      'Active Days',
      'Messages Per Day',
      'Unique Users',
      'First Message',
      'Last Message',
    ];

    const csvRows = [
      headers.join(','),
      ...phoneStats.map(phone =>
        [
          phone.number,
          phone.is_assigned ? 'Yes' : 'No',
          phone.assistant ?? 'N/A',
          phone.messages_sent,
          phone.messages_received,
          phone.total_messages,
          phone.active_days,
          getMessagesPerDay(phone),
          phone.unique_users,
          formatDate(phone.first_message),
          formatDate(phone.last_message),
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `phone-stats-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.append(link);
    link.click();
    link.remove();
  };

  // View message details for a specific phone number
  const viewMessageDetails = (phoneNumber: string) => {
    setSelectedPhoneNumber(phoneNumber);
    setIsMessageDetailsOpen(true);
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Phone Number Analytics</span>
          </div>
          <div className="flex gap-2">
            <Select
              value={timeframe}
              onValueChange={value => {
                setTimeframe(value);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="180d">Last 180 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadPhoneStats} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Usage statistics and analytics for your phone numbers</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">Error Loading Data</p>
                <p className="mt-1 text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={loadPhoneStats} className="mt-2">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
        {!error && isLoading && (
          <div className="py-8 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground/50" />
            <p className="text-muted-foreground">Loading phone statistics...</p>
          </div>
        )}
        {!error && !isLoading && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Phone Numbers</p>
                      <p className="text-2xl font-bold">{usageSummary.total}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Numbers</p>
                      <p className="text-2xl font-bold">{usageSummary.activePhones}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                      <p className="text-2xl font-bold">{usageSummary.totalMessages}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Timeframe</p>
                      <p className="text-2xl font-bold">{getTimeframeDisplay(timeframe)}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Usage Status */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Phone Number Status</CardTitle>
                  <CardDescription>Distribution of assigned vs. unassigned numbers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut
                      data={generateUsageOverviewData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                        cutout: '70%',
                      }}
                    />
                  </div>

                  <div className="mt-4 flex justify-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Assigned</p>
                      <p className="text-lg font-medium">{usageSummary.assigned}</p>
                      <p className="text-xs text-muted-foreground">
                        {calculatePercentage(usageSummary.assigned, usageSummary.total)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Unassigned</p>
                      <p className="text-lg font-medium">{usageSummary.unassigned}</p>
                      <p className="text-xs text-muted-foreground">
                        {calculatePercentage(usageSummary.unassigned, usageSummary.total)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages By Phone Chart */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Message Volume by Phone</CardTitle>
                  <CardDescription>Top 10 most active phone numbers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar
                      data={generateMessagesChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            stacked: true,
                          },
                          y: {
                            stacked: true,
                            beginAtZero: true,
                          },
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phone Number Stats Table */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Phone Number Details</h3>
                <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-3 text-left font-medium">Phone Number</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Messages</th>
                      <th className="px-4 py-3 text-left font-medium">Active Days</th>
                      <th className="px-4 py-3 text-left font-medium">Unique Users</th>
                      <th className="px-4 py-3 text-left font-medium">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {phoneStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          No phone number activity data available.
                        </td>
                      </tr>
                    ) : (
                      phoneStats.map(phone => (
                        <tr
                          key={phone.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            viewMessageDetails(phone.number);
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono">{phone.number}</div>
                            <div className="text-xs text-muted-foreground">
                              {phone.assistant && <span>Assigned to: {phone.assistant}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {phone.is_assigned ? (
                              <Badge
                                variant="outline"
                                className="border-green-200 bg-green-50 text-green-700"
                              >
                                Assigned
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-gray-200 bg-gray-50 text-gray-700"
                              >
                                Unassigned
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{phone.total_messages}</div>
                            <div className="flex gap-1 text-xs text-muted-foreground">
                              <span>In: {phone.messages_received}</span>
                              <span>|</span>
                              <span>Out: {phone.messages_sent}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const activityRatio = getActivityRatio(phone, timeframe);
                              const activityWidth = `${String(activityRatio)}%`;
                              const activityOpacity = String(activityRatio / 100);
                              const backgroundColor = `rgba(59, 130, 246, ${activityOpacity})`;

                              return (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 rounded-full bg-blue-100"
                                    style={{
                                      width: activityWidth,
                                      backgroundColor,
                                    }}
                                  />
                                  <span className="ml-1 text-xs">
                                    {getActiveDaysDisplay(phone.active_days, timeframe)}
                                  </span>
                                </div>
                              );
                            })()}
                            <div className="text-xs text-muted-foreground">
                              ~{getMessagesPerDay(phone)}/day
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{phone.unique_users}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{getLastActiveTime(phone.last_message)}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {selectedPhoneNumber && (
        <TwilioMessageDetails
          phoneNumber={selectedPhoneNumber}
          open={isMessageDetailsOpen}
          onClose={() => {
            setIsMessageDetailsOpen(false);
          }}
        />
      )}

      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Data shown for {getTimeframeDescription(timeframe)}
        </p>
      </CardFooter>
    </Card>
  );
}
