'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { User } from '@supabase/supabase-js';
import { BarChart3, Download, FileSpreadsheet, Filter, Scroll, Users, Zap } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserUsageTable } from '@/components/admin/UserUsageTable';
import { Loading } from '@/components/concierge/Loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { createClient } from '@/utils/supabase/client';

// Real user usage data fetching function
const fetchUserUsageData = async (startDate: Date, endDate: Date) => {
  try {
    const supabase = createClient();

    // Get usage data directly from analytics.interactions table
    const { data: interactions, error } = await supabase
      .schema('analytics')
      .from('interactions')
      .select('user_id, token_usage, cost_estimate')
      .gte('interaction_time', startDate.toISOString())
      .lte('interaction_time', endDate.toISOString());

    if (error) {
      console.error('Error fetching user usage data:', error);
      return [];
    }

    // Group by user_id to calculate stats
    const userStatsMap = new Map<
      string,
      {
        user_id: string;
        interactions_count: number;
        token_usage: number;
        cost_estimate: number;
      }
    >();

    interactions.forEach(interaction => {
      if (!interaction.user_id) return;

      if (!userStatsMap.has(interaction.user_id)) {
        userStatsMap.set(interaction.user_id, {
          user_id: interaction.user_id,
          interactions_count: 0,
          token_usage: 0,
          cost_estimate: 0,
        });
      }

      const stats = userStatsMap.get(interaction.user_id);
      if (stats) {
        stats.interactions_count += 1;
        stats.token_usage += interaction.token_usage ?? 0;
        stats.cost_estimate += interaction.cost_estimate ?? 0;
      }
    });

    const data = [...userStatsMap.values()]
      .sort((a, b) => b.token_usage - a.token_usage)
      .slice(0, 100); // Apply limit

    return data.map(item => ({
      id: item.user_id,
      user_id: item.user_id,
      users: {
        id: item.user_id,
        email: `user-${(item.user_id).slice(0, 8)}@example.com`, // We'd need to join with auth users for real email
      },
      total_interactions: item.interactions_count,
      total_tokens: item.token_usage,
      total_cost: item.cost_estimate,
    }));
  } catch (error) {
    console.error('Error in fetchUserUsageData:', error);
    return [];
  }
};

type UserUsageData = {
  id: string;
  user_id: string;
  total_interactions: number;
  total_tokens: number;
  total_cost: number;
  users?: {
    id: string;
    email?: string;
  };
};

export default function UserUsagePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UserUsageData[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });

  const router = useRouter();
  const supabase = createClient();

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

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

        if (userDataError || !userData.is_admin) {
          setIsAdmin(false);
          router.push('/');
          return;
        }

        setIsAdmin(true);

        // Load real usage data
        const realData = await fetchUserUsageData(dateRange.from, dateRange.to);
        setUsageData(realData);
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router, supabase, dateRange.from, dateRange.to]);

  // Handle date range changes - fetch real data based on date range
  const handleDateRangeChange = async (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      const newRange = {
        from: range.from,
        to: range.to ?? new Date(),
      };
      setDateRange(newRange);
      const realData = await fetchUserUsageData(newRange.from, newRange.to);
      setUsageData(realData);
    }
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
          <Button onClick={() => { router.push('/'); }}>Return to Home</Button>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalTokens = usageData.reduce((sum, item) => sum + item.total_tokens, 0);
  const totalCost = usageData.reduce((sum, item) => sum + item.total_cost, 0);
  const totalMessages = usageData.reduce((sum, item) => sum + item.total_interactions, 0);
  const uniqueUserIds = new Set(usageData.map(item => item.user_id));
  const uniqueUserCount = uniqueUserIds.size;

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="max-h-screen flex-1 overflow-y-auto p-8">
        <AdminHeader user={user} />

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">User Usage Analytics</h1>
            <p className="text-muted-foreground">
              Track and analyze user interactions and token usage
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <DateRangePicker
              dateRange={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onDateRangeChange={handleDateRangeChange}
            />

            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h3 className="text-2xl font-bold">{uniqueUserCount}</h3>
                <p className="mt-1 text-xs text-muted-foreground">In selected date range</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <h3 className="text-2xl font-bold">{totalMessages.toLocaleString()}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  ~{Math.round(totalMessages / Math.max(1, uniqueUserCount))} per user
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Scroll className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <h3 className="text-2xl font-bold">{totalTokens.toLocaleString()}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Across all models</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <h3 className="text-2xl font-bold">${totalCost.toFixed(2)}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Average ${(totalCost / Math.max(1, uniqueUserCount)).toFixed(2)} per user
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Detailed Usage by User</CardTitle>
                  <CardDescription>
                    Complete breakdown of user activity and resource consumption
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <UserUsageTable usageData={usageData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
