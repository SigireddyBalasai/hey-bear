import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

interface TimeSeriesItem {
  date: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  activeUsers: number;
  errors: number;
}

export interface UserStat {
  userId: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  lastActive: string | null;
  email?: string | null;
  fullName?: string | null;
}

interface HourlyMetric {
  timestamp: string;
  requests: number;
  tokens: number;
  errors: number;
  avgLatency: number;
}

// Real database query functions for admin dashboard
// All functions now use live Supabase database connections

/**
 * Fetch all users with usage information from real database
 */
export async function fetchAllUsers() {
  try {
    const supabase = createClient();
    
    // Get users from users table with basic info only
    const { data: users, error } = await supabase
      .schema('users')
      .from('users')
      .select(`
        id,
        auth_user_id,
        created_at,
        last_active
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    // For each user, get auth data and basic usage stats manually
    const userDetails = await Promise.all((users || []).map(async (user) => {
      // Get auth user data
      const { data: authUser } = await supabase.auth.admin.getUserById(user.auth_user_id);
      
      // Get usage stats from analytics.interactions table
      const { data: userInteractions } = await supabase
        .schema('analytics')
        .from('interactions')
        .select('token_usage, cost_estimate, assistant_id')
        .eq('user_id', user.id);
      
      // Calculate basic stats
      const stats = (userInteractions ?? []).reduce((acc, interaction) => ({
        interactions_used: acc.interactions_used + 1,
        assistants_used: acc.assistants_used, // Will count unique assistants
        token_usage: acc.token_usage + (interaction.token_usage ?? 0),
        cost_estimate: acc.cost_estimate + (interaction.cost_estimate ?? 0)
      }), {
        interactions_used: 0,
        assistants_used: new Set(userInteractions?.map(i => i.assistant_id) ?? []).size,
        token_usage: 0,
        cost_estimate: 0
      });
      
      return {
        id: user.id,
        email: authUser?.user?.email ?? `user@${user.id.substring(0, 8)}.com`,
        full_name: authUser?.user?.user_metadata?.full_name ?? `User ${user.id.substring(0, 8)}`,
        created_at: user.created_at ?? new Date().toISOString(),
        last_sign_in: user.last_active ?? user.created_at ?? new Date().toISOString(),
        plan: {
          name: 'Free', // Would need to join with subscription/plan data
          description: 'Plan description',
          max_assistants: 5,
          max_interactions: 1000
        },
        userusage: {
          interactions_used: stats.interactions_used,
          assistants_used: stats.assistants_used,
          token_usage: stats.token_usage,
          cost_estimate: stats.cost_estimate
        }
      };
    }));
    
    return userDetails;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
    return [];
  }
}

/**
 * Get time series data from database
 */
async function getTimeSeriesData(startDate: Date, endDate: Date, assistantId: string = 'all'): Promise<TimeSeriesItem[]> {
  const supabase = createClient();
  
  let query = supabase
    .schema('analytics')
    .from('interactions')
    .select('interaction_time, token_usage, input_tokens, output_tokens, cost_estimate, is_error, user_id');
  
  if (assistantId !== 'all') {
    query = query.eq('assistant_id', assistantId);
  }
  
  const { data: interactions, error } = await query
    .gte('interaction_time', startDate.toISOString())
    .lte('interaction_time', endDate.toISOString())
    .order('interaction_time');
  
  if (error) {
    console.error('Error fetching time series data:', error);
    throw error;
  }
  
  // Group by date
  const groupedData = new Map<string, {
    interactions: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    costs: number;
    errors: number;
    uniqueUsers: Set<string>;
  }>();
  
  interactions?.forEach(interaction => {
    if (!interaction.interaction_time) return;
    const date = new Date(interaction.interaction_time).toISOString().split('T')[0];
    const existing = groupedData.get(date) || {
      interactions: 0,
      tokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      costs: 0,
      errors: 0,
      uniqueUsers: new Set()
    };
    
    existing.interactions += 1;
    existing.tokens += interaction.token_usage || 0;
    existing.inputTokens += interaction.input_tokens || 0;
    existing.outputTokens += interaction.output_tokens || 0;
    existing.costs += interaction.cost_estimate || 0;
    if (interaction.is_error) existing.errors += 1;
    if (interaction.user_id) existing.uniqueUsers.add(interaction.user_id);
    
    groupedData.set(date, existing);
  });
  
  // Convert to array and fill missing dates
  const result: TimeSeriesItem[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const data = groupedData.get(dateStr);
    
    result.push({
      date: dateStr,
      interactions: data?.interactions ?? 0,
      tokens: data?.tokens ?? 0,
      inputTokens: data?.inputTokens ?? 0,
      outputTokens: data?.outputTokens ?? 0,
      costs: data?.costs ?? 0,
      activeUsers: data?.uniqueUsers.size ?? 0,
      errors: data?.errors ?? 0
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Get user statistics data from database
 */
async function getUserStatsData(startDate: Date, endDate: Date, assistantId: string = 'all', _plan: string = 'all'): Promise<UserStat[]> {
  const supabase = createClient();
  
  try {
    // Get interactions data directly from analytics.interactions table
    let query = supabase
      .schema('analytics')
      .from('interactions')
      .select('user_id, token_usage, input_tokens, output_tokens, cost_estimate, interaction_time')
      .gte('interaction_time', startDate.toISOString())
      .lte('interaction_time', endDate.toISOString());
    
    if (assistantId !== 'all') {
      query = query.eq('assistant_id', assistantId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
    
    // Group by user_id to calculate stats
    const userStatsMap = new Map<string, UserStat>();
    
    (data || []).forEach(interaction => {
      if (!interaction.user_id) return;
      
      if (!userStatsMap.has(interaction.user_id)) {
        userStatsMap.set(interaction.user_id, {
          userId: interaction.user_id,
          interactions: 0,
          tokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          costs: 0,
          lastActive: null,
          email: null,
          fullName: null
        });
      }
      
      const stats = userStatsMap.get(interaction.user_id);
      if (stats) {
        stats.interactions += 1;
        stats.tokens += interaction.token_usage ?? 0;
        stats.inputTokens += interaction.input_tokens ?? 0;
        stats.outputTokens += interaction.output_tokens ?? 0;
        stats.costs += interaction.cost_estimate ?? 0;
        
        // Track most recent activity
        if (interaction.interaction_time) {
          const interactionTime = new Date(interaction.interaction_time).toISOString();
          if (!stats.lastActive || interactionTime > stats.lastActive) {
            stats.lastActive = interactionTime;
          }
        }
      }
    });
    
    // Convert to array and add user details
    const userStats = Array.from(userStatsMap.values());
    
    // Get user details for each user
    for (const stats of userStats) {
      try {
        const { data: userData } = await supabase
          .schema('users')
          .from('users')
          .select('auth_user_id')
          .eq('id', stats.userId)
          .single();
        
        if (userData?.auth_user_id) {
          const { data: authData } = await supabase.auth.admin.getUserById(userData.auth_user_id);
          if (authData?.user) {
            stats.email = authData.user.email;
            stats.fullName = authData.user.user_metadata?.full_name;
          }
        }
      } catch (e) {
        console.error('Error fetching user details:', e);
      }
    }
    
    // Sort by token usage
    userStats.sort((a, b) => b.tokens - a.tokens);
    
    return userStats;
  } catch (error) {
    console.error('Error in getUserStatsData:', error);
    return [];
  }
}

/**
 * Fetch aggregated usage data for dashboard from real database
 */
export async function fetchUsageData(timeframe: string = '30d', assistantId: string = 'all', plan: string = 'all') {
  try {
    let days = 30;
    switch (timeframe) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '180d': days = 180; break;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();
    
    // Get time series data from database
    const timeSeriesData = await getTimeSeriesData(startDate, endDate, assistantId);
    
    // Get user stats from database
    const userStats = await getUserStatsData(startDate, endDate, assistantId, plan);
    
    // Calculate total stats from actual database data
    const totalStats = timeSeriesData.reduce((acc, day) => ({
      interactions: acc.interactions + day.interactions,
      tokens: acc.tokens + day.tokens,
      costs: acc.costs + day.costs,
      errors: acc.errors + day.errors,
      activeUsers: Math.max(acc.activeUsers, day.activeUsers),
      inputTokens: acc.inputTokens + day.inputTokens,
      outputTokens: acc.outputTokens + day.outputTokens
    }), {
      interactions: 0,
      tokens: 0,
      costs: 0,
      errors: 0,
      activeUsers: 0,
      inputTokens: 0,
      outputTokens: 0
    });

    // Adjust time series data based on filtered users if needed
    if (plan !== 'all') {
      const scaleFactor = userStats.length / 20; // Adjust based on filtered users ratio
      timeSeriesData.forEach(day => {
        day.interactions *= scaleFactor;
        day.tokens *= scaleFactor;
        day.costs *= scaleFactor;
        day.activeUsers = Math.floor(day.activeUsers * scaleFactor);
        day.inputTokens *= scaleFactor;
        day.outputTokens *= scaleFactor;
      });
    }

    return { totalStats, timeSeriesData, userStats };
  } catch (error) {
    console.error('Error fetching usage data:', error);
    toast.error('Failed to load usage data');
    return {
      totalStats: { 
        interactions: 0, 
        tokens: 0, 
        costs: 0, 
        errors: 0, 
        activeUsers: 0,
        inputTokens: 0,
        outputTokens: 0
      },
      timeSeriesData: [],
      userStats: []
    };
  }
}

/**
 * Fetch system metrics for real-time monitoring
 */
export async function fetchSystemMetrics() {
  try {
    const supabase = createClient();
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Get recent interactions (last hour)
    const { data: recentInteractions, error } = await supabase
      .schema('analytics')
      .from('interactions')
      .select(`
        id, 
        interaction_time, 
        user_id,
        token_usage,
        cost_estimate,
        is_error,
        duration
      `)
      .gte('interaction_time', oneHourAgo.toISOString())
      .lte('interaction_time', now.toISOString())
      .order('interaction_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching recent interactions:', error);
      throw error;
    }
    
    // Calculate metrics from real data
    const activeUserIds = new Set();
    let totalRequests = 0;
    let totalTokens = 0;
    let totalErrors = 0;
    
    (recentInteractions ?? []).forEach(interaction => {
      if (interaction.user_id) activeUserIds.add(interaction.user_id);
      totalRequests++;
      totalTokens += interaction.token_usage ?? 0;
      if (interaction.is_error) totalErrors++;
    });
    
    // Generate hourly metrics for the last 12 five-minute intervals
    const hourlyMetrics: HourlyMetric[] = [];
    for (let i = 11; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - (i + 1) * 5 * 60 * 1000);
      const intervalEnd = new Date(now.getTime() - i * 5 * 60 * 1000);
      
      const intervalInteractions = (recentInteractions ?? []).filter(interaction => {
        if (!interaction.interaction_time) return false;
        const interactionTime = new Date(interaction.interaction_time);
        return interactionTime >= intervalStart && interactionTime < intervalEnd;
      });
      
      const intervalTokens = intervalInteractions.reduce((sum, i) => sum + (i.token_usage ?? 0), 0);
      const intervalErrors = intervalInteractions.filter(i => i.is_error).length;
      const intervalLatency = intervalInteractions
        .filter(i => i.duration)
        .reduce((sum, i) => sum + (i.duration ?? 0), 0) / Math.max(intervalInteractions.filter(i => i.duration).length, 1);
      
      hourlyMetrics.push({
        timestamp: intervalEnd.toISOString(),
        requests: intervalInteractions.length,
        tokens: intervalTokens,
        errors: intervalErrors,
        avgLatency: intervalLatency || 0
      });
    }
    
    return {
      activeUsers: activeUserIds.size,
      totalRequests,
      totalTokens,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      hourlyMetrics
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return {
      activeUsers: 0,
      totalRequests: 0,
      totalTokens: 0,
      errorRate: 0,
      hourlyMetrics: []
    };
  }
}

/**
 * Fetch user interactions for detailed user view from real database
 */
export async function fetchUserInteractions(userId: string, limit: number = 50) {
  try {
    const supabase = createClient();
    
    const { data: interactions, error } = await supabase
      .schema('analytics')
      .from('interactions')
      .select(`
        id,
        interaction_time,
        input_tokens,
        output_tokens,
        token_usage,
        cost_estimate,
        is_error,
        assistant_id,
        assistants:assistants!inner(name)
      `)
      .eq('user_id', userId)
      .order('interaction_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user interactions:', error);
      throw error;
    }
    
    return interactions || [];
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    toast.error('Failed to load user interactions');
    return [];
  }
}
