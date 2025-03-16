import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const timeframe = url.searchParams.get('timeframe') || '30d';

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

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '180d':
        startDate.setDate(endDate.getDate() - 180);
        break;
      case '1y':
        startDate.setDate(endDate.getDate() - 365);
        break;
      case '30d':
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Get interactions within date range
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select(`
        id, 
        interaction_time, 
        user_id,
        token_usage,
        cost_estimate,
        is_error,
        assistant_id
      `)
      .gte('interaction_time', startDateStr)
      .lte('interaction_time', endDateStr);
    
    if (interactionsError) throw interactionsError;

    // Get unique active users in period
    const activeUsers = new Set();
    interactions?.forEach(interaction => {
      if (interaction.user_id) activeUsers.add(interaction.user_id);
    });
    
    // Get total interaction metrics
    const totalStats = {
      interactions: interactions?.length || 0,
      tokens: interactions?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0,
      cost: interactions?.reduce((sum, i) => sum + (i.cost_estimate || 0), 0) || 0,
      errors: interactions?.filter(i => i.is_error).length || 0,
      activeUsers: activeUsers.size
    };
    
    // Group by day for time series
    const dailyData = new Map();
    
    interactions?.forEach(interaction => {
      const date = new Date(interaction.interaction_time || new Date()).toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          interactions: 0,
          tokens: 0,
          cost: 0,
          uniqueUsers: new Set(),
          errors: 0
        });
      }
      
      const dayData = dailyData.get(date);
      dayData.interactions++;
      dayData.tokens += interaction.token_usage || 0;
      dayData.cost += interaction.cost_estimate || 0;
      if (interaction.user_id) dayData.uniqueUsers.add(interaction.user_id);
      if (interaction.is_error) dayData.errors++;
    });
    
    // Convert to array and format for response
    const timeSeriesData = Array.from(dailyData.values()).map(day => ({
      date: day.date,
      interactions: day.interactions,
      tokens: day.tokens,
      cost: day.cost,
      activeUsers: day.uniqueUsers.size,
      errors: day.errors
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Get user-specific stats
    const userStats = new Map();
    
    interactions?.forEach(interaction => {
      if (!interaction.user_id) return;
      
      if (!userStats.has(interaction.user_id)) {
        userStats.set(interaction.user_id, {
          userId: interaction.user_id,
          interactions: 0,
          tokens: 0,
          cost: 0,
          assistantIds: new Set(),
          firstActivity: interaction.interaction_time,
          lastActivity: interaction.interaction_time
        });
      }
      
      const userData = userStats.get(interaction.user_id);
      userData.interactions++;
      userData.tokens += interaction.token_usage || 0;
      userData.cost += interaction.cost_estimate || 0;
      
      if (interaction.assistant_id) {
        userData.assistantIds.add(interaction.assistant_id);
      }
      
      // Update first/last activity
      if (new Date(interaction.interaction_time || new Date()) < new Date(userData.firstActivity || new Date())) {
        userData.firstActivity = interaction.interaction_time;
      }
      if (new Date(interaction.interaction_time || new Date()) > new Date(userData.lastActivity || new Date())) {
        userData.lastActivity = interaction.interaction_time;
      }
    });
    
    // Get user details and format for response
    const userUsageData = await Promise.all(
      Array.from(userStats.entries()).map(async ([userId, stats]) => {
        // Get user email
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('auth_user_id')
          .eq('id', userId)
          .single();
          
        let email = null;
        let fullName = null;
        
        if (userData?.auth_user_id && !userDataError) {
          const { data } = await supabase.auth.admin.getUserById(userData.auth_user_id);
          if (data?.user) {
            email = data.user.email;
            fullName = data.user.user_metadata?.full_name;
          }
        }
        
        return {
          userId,
          email,
          fullName,
          interactions: stats.interactions,
          tokens: stats.tokens,
          cost: stats.cost,
          assistantsCount: stats.assistantIds.size,
          firstActivity: stats.firstActivity,
          lastActivity: stats.lastActivity
        };
      })
    );
    
    // Sort by token usage
    userUsageData.sort((a, b) => b.tokens - a.tokens);

    return NextResponse.json({
      summary: totalStats,
      timeSeriesData,
      userUsageData
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' }, 
      { status: 500 }
    );
  }
}
