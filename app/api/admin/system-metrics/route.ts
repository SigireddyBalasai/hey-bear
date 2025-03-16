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
    
    // Calculate time periods
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get metrics from interactions table
    
    // Last hour metrics
    const { data: lastHourData, error: lastHourError } = await supabase
      .from('interactions')
      .select('id, token_usage, cost_estimate, is_error')
      .gte('interaction_time', oneHourAgo.toISOString());
      
    if (lastHourError) throw lastHourError;
    
    // Last day metrics
    const { data: lastDayData, error: lastDayError } = await supabase
      .from('interactions')
      .select('id, token_usage, cost_estimate, is_error')
      .gte('interaction_time', oneDayAgo.toISOString());
      
    if (lastDayError) throw lastDayError;
    
    // Last week metrics
    const { data: lastWeekData, error: lastWeekError } = await supabase
      .from('interactions')
      .select('id, token_usage, cost_estimate, is_error')
      .gte('interaction_time', sevenDaysAgo.toISOString());
      
    if (lastWeekError) throw lastWeekError;
    
    // Get unique active users in the last 24 hours
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('interactions')
      .select('user_id')
      .gte('interaction_time', oneDayAgo.toISOString());
      
    if (activeUsersError) throw activeUsersError;
    
    // Count unique user IDs
    const activeUserIds = new Set();
    activeUsersData?.forEach(item => {
      if (item.user_id) activeUserIds.add(item.user_id);
    });
    const activeUsers = activeUserIds.size;
    
    // Get hourly metrics
    const hourlyMetrics = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      const { data: hourData, error: hourError } = await supabase
        .from('interactions')
        .select('id, token_usage, cost_estimate, is_error')
        .gte('interaction_time', hourStart.toISOString())
        .lt('interaction_time', hourEnd.toISOString());
      
      if (hourError) throw hourError;
      
      const requests = hourData?.length || 0;
      const errors = hourData?.filter(i => i.is_error).length || 0;
      const tokens = hourData?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0;
      
      hourlyMetrics.push({
        timestamp: hourStart.toISOString(),
        apiRequests: requests,
        apiErrors: errors,
        tokenUsage: tokens
      });
    }
    
    // Calculate error rate
    const lastHourRequests = lastHourData?.length || 0;
    const lastHourErrors = lastHourData?.filter(item => item.is_error).length || 0;
    const errorRate = lastHourRequests > 0 ? lastHourErrors / lastHourRequests : 0;
    
    // Return metrics
    return NextResponse.json({
      summary: {
        interactions: {
          hour: lastHourData?.length || 0,
          day: lastDayData?.length || 0,
          week: lastWeekData?.length || 0
        },
        tokens: {
          hour: lastHourData?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0,
          day: lastDayData?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0,
          week: lastWeekData?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0
        },
        costs: {
          hour: lastHourData?.reduce((sum, i) => sum + (i.cost_estimate || 0), 0) || 0,
          day: lastDayData?.reduce((sum, i) => sum + (i.cost_estimate || 0), 0) || 0,
          week: lastWeekData?.reduce((sum, i) => sum + (i.cost_estimate || 0), 0) || 0
        },
        errors: {
          hour: lastHourData?.filter(i => i.is_error).length || 0,
          day: lastDayData?.filter(i => i.is_error).length || 0,
          week: lastWeekData?.filter(i => i.is_error).length || 0
        },
        activeUsers
      },
      hourlyMetrics,
      systemStatus: {
        apiGateway: { 
          status: errorRate > 0.1 ? 'degraded' : 'operational',
          uptime: 99.99,
          responseTime: 145
        },
        database: {
          status: 'operational',
          uptime: 99.95,
          responseTime: 12
        },
        aiModels: {
          status: errorRate > 0.2 ? 'degraded' : 'operational',
          uptime: 98.45,
          responseTime: 312
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' }, 
      { status: 500 }
    );
  }
}

// Function to manually update interaction metrics
export async function POST(request: Request) {
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
    
    // Get interaction to update
    const body = await request.json();
    const { interaction_id, token_usage, cost_estimate, is_error } = body;
    
    if (!interaction_id) {
      return NextResponse.json(
        { error: 'Interaction ID is required' }, 
        { status: 400 }
      );
    }
    
    // Update the interaction
    const { data, error } = await supabase
      .from('interactions')
      .update({
        token_usage,
        cost_estimate,
        is_error
      })
      .eq('id', interaction_id)
      .select();
      
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to update metrics' }, 
      { status: 500 }
    );
  }
}
