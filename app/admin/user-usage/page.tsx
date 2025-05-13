"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '../../Concierge/Loading';
import { 
  Users,
  BarChart3, 
  Scroll, 
  FileSpreadsheet, 
  Zap,
  Filter,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '../AdminSidebar';
import { AdminHeader } from '../AdminHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { UserUsageTable } from '../UserUsageTable';
import { Database } from '@/lib/db.types';

export default function UserUsagePage() {
  // Using proper database types and Auth user type
  const [user, setUser] = useState<any>(null); // Using any temporarily to fix the type mismatch
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Update to use any type temporarily to resolve type errors 
  const [usageData, setUsageData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(Date.now()+ 24 * 60 * 60 * 1000)
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
        // await fetchUsageData();
        
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  // Fetch usage data using proper database structure
  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range for query
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];
      
      // Direct query joining monthly_usage and users tables
      // Use the new date_field for date range filtering
      const { data: monthlyUsage, error: usageError } = await supabase
        .from('monthly_usage')
        .select(`
          id,
          year,
          month,
          date_field,
          interaction_count,
          input_tokens,
          output_tokens,
          total_cost,
          user_id,
          created_at,
          users (
            id,
            auth_user_id,
            metadata,
            created_at
          )
        `)
        .gte('date_field', fromDate)
        .lte('date_field', toDate)
        .order('date_field', { ascending: false })
        .limit(100);
      
      if (usageError) throw usageError;
      
      // Convert monthly_usage data to the format expected by UserUsageTable
      // Only using database columns without adding extra fields
      const formattedData = await Promise.all((monthlyUsage || []).map(async (usage) => {
        // Get the auth user data if available
        if (usage.users?.auth_user_id) {
          const { data } = await supabase.auth.admin.getUserById(usage.users.auth_user_id);
          if (data?.user) {
            // Add auth user data to users object with proper type assertion
            usage.users = {
              ...usage.users,
              // Add these properties using type assertion since they're not in the original type
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name
            } as any; // Using type assertion to add properties not in the original type
          }
        }
        
        // Instead of assigning to a non-existent 'date' property, use the existing date_field
        // or add the date property with type assertion
        const formattedUsage = {
          ...usage,
          date: usage.date_field // Add the date property for compatibility with the table component
        };
        
        return formattedUsage;
      }));
      
      setUsageData(formattedData);
      
    } catch (error) {
      console.error('Error fetching usage data:', error);
      // Fix the toast call format
      toast("Failed to fetch user usage data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (range: {from: Date | undefined, to: Date | undefined} | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({from: range.from, to: range.to});
      // Refresh data with new date range
      fetchUsageData();
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

  // Calculate total tokens and cost using database fields only
  const totalInputTokens = usageData.reduce((sum, item) => sum + (item.input_tokens || 0), 0);
  const totalOutputTokens = usageData.reduce((sum, item) => sum + (item.output_tokens || 0), 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const totalCost = usageData.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const totalMessages = usageData.reduce((sum, item) => sum + (item.interaction_count || 0), 0);

  // Get unique user count
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
              onDateRangeChange={(range) => {
                if (range?.from && range?.to) {
                  handleDateRangeChange({from: range.from, to: range.to});
                }
              }} 
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
