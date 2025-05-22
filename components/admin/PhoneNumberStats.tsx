"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  MessageSquare,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArcElement,
  Filler
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { TwilioMessageDetails } from './TwilioMessageDetails';

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

interface PhoneNumberStatsProps {
  phoneStats: any[];
  usageSummary: {
    total: number;
    assigned: number;
    unassigned: number;
    totalMessages: number;
    activePhones: number;
  };
  isLoading: boolean;
  error: string | null;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  onRefresh: () => void;
  onExportData: () => void;
  onViewMessageDetails: (phoneNumber: string) => void;
}

export function PhoneNumberStats({
  phoneStats,
  usageSummary,
  isLoading,
  error,
  timeframe,
  onTimeframeChange,
  onRefresh,
  onExportData,
  onViewMessageDetails
}: PhoneNumberStatsProps) {
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
        }
      ]
    };
  };

  // Generate data for usage overview chart
  const generateUsageOverviewData = () => {
    return {
      labels: ['Assigned', 'Unassigned'],
      datasets: [
        {
          data: [usageSummary.assigned, usageSummary.unassigned],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(201, 203, 207, 0.8)'
          ],
          borderColor: [
            'rgb(75, 192, 192)',
            'rgb(201, 203, 207)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    // Basic formatting for US numbers
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    return phoneNumber;
  };

  // Calculate messages per day for a phone
  const getMessagesPerDay = (phone: any) => {
    if (!phone.active_days || phone.active_days === 0) return 0;
    return (phone.total_messages / phone.active_days).toFixed(1);
  };

  // Calculate activity ratio (active days / timeframe days)
  const getActivityRatio = (phone: any) => {
    let totalDays = 30; // Default
    
    switch (timeframe) {
      case '7d': totalDays = 7; break;
      case '90d': totalDays = 90; break;
      case '180d': totalDays = 180; break;
      default: totalDays = 30;
    }
    
    return Math.min(100, Math.round((phone.active_days / totalDays) * 100));
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <Select value={timeframe} onValueChange={onTimeframeChange}>
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
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Usage statistics and analytics for your phone numbers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">Error Loading Data</p>
                <p className="text-sm mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Loading phone statistics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Phone Numbers</p>
                      <p className="text-2xl font-bold">{usageSummary.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
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
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
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
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
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
                      <p className="text-2xl font-bold">
                        {timeframe === '7d' ? '7 Days' : 
                         timeframe === '90d' ? '3 Months' :
                         timeframe === '180d' ? '6 Months' : '30 Days'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Usage Status */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Phone Number Status</CardTitle>
                  <CardDescription>
                    Distribution of assigned vs. unassigned numbers
                  </CardDescription>
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
                          }
                        },
                        cutout: '70%'
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-center mt-4 gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Assigned</p>
                      <p className="text-lg font-medium">{usageSummary.assigned}</p>
                      <p className="text-xs text-muted-foreground">
                        {usageSummary.total ? (usageSummary.assigned / usageSummary.total * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Unassigned</p>
                      <p className="text-lg font-medium">{usageSummary.unassigned}</p>
                      <p className="text-xs text-muted-foreground">
                        {usageSummary.total ? (usageSummary.unassigned / usageSummary.total * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Messages By Phone Chart */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Message Volume by Phone</CardTitle>
                  <CardDescription>
                    Top 10 most active phone numbers
                  </CardDescription>
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
                            beginAtZero: true
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Phone Number Stats Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Phone Number Details</h3>
                <Button variant="outline" size="sm" onClick={onExportData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </div>
              
              <div className="rounded-md border overflow-x-auto">
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
                      phoneStats.map((phone) => (
                        <tr 
                          key={phone.id} 
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => onViewMessageDetails(phone.number)}
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono">{phone.number}</div>
                            <div className="text-xs text-muted-foreground">
                              {phone.assistant && (
                                <span>Assigned to: {phone.assistant}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {phone.is_assigned ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Assigned
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Unassigned
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{phone.total_messages}</div>
                            <div className="text-xs text-muted-foreground flex gap-1">
                              <span>In: {phone.messages_received}</span>
                              <span>|</span>
                              <span>Out: {phone.messages_sent}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <div 
                                className="h-2 rounded-full bg-blue-100"
                                style={{
                                  width: `${getActivityRatio(phone)}%`,
                                  backgroundColor: `rgba(59, 130, 246, ${getActivityRatio(phone)/100})`
                                }}
                              />
                              <span className="ml-1 text-xs">{phone.active_days}/{
                                timeframe === '7d' ? 7 : 
                                timeframe === '90d' ? 90 :
                                timeframe === '180d' ? 180 : 30
                              }</span>
                            </div>
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
                              <span>{phone.last_message ? formatDate(phone.last_message) : 'Never'}</span>
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
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <p className="text-xs text-muted-foreground">
          Data shown for {
            timeframe === '7d' ? 'the last 7 days' : 
            timeframe === '90d' ? 'the last 3 months' :
            timeframe === '180d' ? 'the last 6 months' : 'the last 30 days'
          }
        </p>
      </CardFooter>
    </Card>
  );
}
