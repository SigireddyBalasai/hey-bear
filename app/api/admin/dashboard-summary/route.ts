import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    // Check if user is authenticated and an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Check admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }
    
    // Get time periods
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    // Get total user count
    const { count: totalUsers, error: userCountError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
      
    if (userCountError) throw userCountError;
    
    // Get active users in the last 24 hours
    const { data: activeUsersDay, error: activeUserDayError } = await supabase
      .from('users')
      .select('id')
      .gte('last_active', oneDayAgo.toISOString());
      
    if (activeUserDayError) throw activeUserDayError;
    
    // Get active users in the last 7 days
    const { data: activeUsersWeek, error: activeUserWeekError } = await supabase
      .from('users')
      .select('id')
      .gte('last_active', sevenDaysAgo.toISOString());
      
    if (activeUserWeekError) throw activeUserWeekError;
    
    // Get assistant count
    const { count: totalAssistants, error: assistantCountError } = await supabase
      .from('assistants')
      .select('id', { count: 'exact', head: true });
      
    if (assistantCountError) throw assistantCountError;
    
    // Get recent interaction stats
    const { data: recentInteractions, error: recentInteractionsError } = await supabase
      .from('interactions')
      .select('id, token_usage, cost_estimate, is_error, interaction_time')
      .gte('interaction_time', thirtyDaysAgo.toISOString());
      
    if (recentInteractionsError) throw recentInteractionsError;
    
    // Calculate usage metrics
    const totalMessages = recentInteractions?.length || 0;
    const totalTokens = recentInteractions?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0;
    const totalCost = recentInteractions?.reduce((sum, i) => sum + (i.cost_estimate || 0), 0) || 0;
    const errorCount = recentInteractions?.filter(i => i.is_error).length || 0;
    
    // Get daily usage for chart
    const dailyUsage = new Map();
    
    recentInteractions?.forEach(interaction => {
      const date = interaction.interaction_time 
        ? new Date(interaction.interaction_time).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      if (!dailyUsage.has(date)) {
        dailyUsage.set(date, {
          date,
          count: 0,
          tokens: 0,
          cost: 0
        });
      }
      
      const day = dailyUsage.get(date);
      day.count++;
      day.tokens += interaction.token_usage || 0;
      day.cost += interaction.cost_estimate || 0;
    });
    
    // Convert to array and sort by date
    const usageChart = Array.from(dailyUsage.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days
    
    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        activeToday: activeUsersDay?.length || 0,
        activeThisWeek: activeUsersWeek?.length || 0
      },
      assistants: {
        total: totalAssistants || 0
      },
      usage: {
        totalMessages,
        totalTokens,
        totalCost,
        errorRate: totalMessages ? (errorCount / totalMessages) : 0
      },
      usageChart
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' }, 
      { status: 500 }
    );
  }
}
