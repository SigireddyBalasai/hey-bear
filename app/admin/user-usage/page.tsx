"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/concierge/Loading';
import { 
  Users,
  BarChart3, 
  Scroll, 
  FileSpreadsheet, 
  Zap,
  Filter,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { UserUsageTable } from '@/components/admin/UserUsageTable';

// Generate mock usage data
const generateMockUserUsage = () => {
  const users = [];
  const totalUsers = 50;

  for (let i = 0; i < totalUsers; i++) {
    const interactions = Math.floor(Math.random() * 1000) + 100;
    const tokens = Math.floor(Math.random() * 100000) + 10000;
    const cost = Number((Math.random() * 100 + 20).toFixed(2));

    users.push({
      id: `user-${i + 1}`,
      user_id: `user-${i + 1}`,
      users: {
        full_name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      message_count: interactions,
      token_usage: tokens,
      cost_estimate: cost,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }

  return users;
};

export default function UserUsagePage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
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
          .schema('users')
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
        
        // Load mock usage data
        const mockData = generateMockUserUsage();
        setUsageData(mockData);
        
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  // Handle date range changes - in mock data mode, this just regenerates random data
  const handleDateRangeChange = (range: { from?: Date, to?: Date } | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || new Date()
      });
      const mockData = generateMockUserUsage();
      setUsageData(mockData);
    }
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

  // Calculate summary statistics
  const totalTokens = usageData.reduce((sum, item) => sum + (item.token_usage || 0), 0);
  const totalCost = usageData.reduce((sum, item) => sum + (item.cost_estimate || 0), 0);
  const totalMessages = usageData.reduce((sum, item) => sum + (item.message_count || 0), 0);
  const uniqueUserIds = new Set(usageData.map(item => item.user_id));
  const uniqueUserCount = uniqueUserIds.size;

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        <AdminHeader user={user} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Usage Analytics</h1>
            <p className="text-muted-foreground">Track and analyze user interactions and token usage</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker 
              dateRange={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onDateRangeChange={handleDateRangeChange}
            />
            
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h3 className="text-2xl font-bold">{uniqueUserCount}</h3>
                <p className="text-xs text-muted-foreground mt-1">In selected date range</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <h3 className="text-2xl font-bold">{totalMessages.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Math.round(totalMessages / Math.max(1, uniqueUserCount))} per user
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Scroll className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <h3 className="text-2xl font-bold">{totalTokens.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1">Across all models</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <h3 className="text-2xl font-bold">${totalCost.toFixed(2)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Average ${(totalCost / Math.max(1, uniqueUserCount)).toFixed(2)} per user</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
