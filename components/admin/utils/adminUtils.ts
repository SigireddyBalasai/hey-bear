import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Add type definition for interaction to fix the type error
interface Interaction {
  id: string;
  user_id?: string;
  interaction_time?: string;
  token_usage?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost_estimate?: number;
  is_error?: boolean;
  assistant_id?: string;
}

/**
 * Check if current user is an admin
 */
export async function checkAdminStatus(user: any) {
  try {
    const supabase = await createClient();
    
    // Check admin status in database
    const { data: userData, error: userDataError } = await supabase
      .schema('users')
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData) {
      console.error('Error checking admin status:', userDataError);
      return false;
    }
    
    return userData.is_admin || false;
  } catch (error) {
    console.error('Error in checkAdminStatus:', error);
    return false;
  }
}

/**
 * Fetch all users with usage information
 */
export async function fetchAllUsers() {
  const supabase = await createClient();
  
  try {
    // Get users with their plans and usage info
    const { data: users, error } = await supabase
      .schema('users')
      .from('users')
      .select(`
        *,
        plan:plan_id (
          id,
          name,
          description,
          max_assistants,
          max_interactions
        ),
        userusage (
          interactions_used,
          assistants_used,
          token_usage,
          cost_estimate
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Get auth info for each user
    const usersWithAuthData = [];
    
    for (const userRecord of (users || [])) {
      if (!userRecord.auth_user_id) {
        usersWithAuthData.push(userRecord);
        continue;
      }
      
      try {
        const { data } = await supabase.auth.admin.getUserById(userRecord.auth_user_id);
        
        usersWithAuthData.push({
          ...userRecord,
          email: data?.user?.email,
          full_name: data?.user?.user_metadata?.full_name,
          last_sign_in: data?.user?.last_sign_in_at
        });
      } catch (e) {
        // Still include the user even if we can't get their auth data
        usersWithAuthData.push(userRecord);
        console.error(`Failed to get auth data for user ${userRecord.id}:`, e);
      }
    }
    
    return usersWithAuthData;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Fetch aggregated usage data for dashboard
 */
export async function fetchUsageData(timeframe: string = '30d') {
  try {
    const supabase = await createClient();
    
    // Calculate start date based on timeframe
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '180d':
        startDate.setDate(now.getDate() - 180);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Fetch interactions for the specified timeframe
    const { data: interactions, error } = await supabase
      .schema('analytics')
      .from('interactions')
      .select(`
        id, 
        interaction_time,
        token_usage,
        input_tokens,
        output_tokens,
        cost_estimate,
        user_id,
        is_error
      `)
      .gte('interaction_time', startDateStr)
      .lte('interaction_time', endDateStr);
    
    if (error) throw error;
    
    if (!interactions) return {
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
    
    // Get unique active users in period - properly typed to fix the error
    const activeUsers = new Set(
      Array.isArray(interactions) 
        ? (interactions as Interaction[])
            .filter(i => i && typeof i === 'object' && 'user_id' in i && i.user_id)
            .map(i => i.user_id as string)
        : []
    );
    
    // Get total interaction metrics
    // Use the actual input_tokens and output_tokens fields from the interactions table
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    const totalStats = {
      interactions: interactions.length,
      tokens: interactions.reduce((sum, i) => sum + (i.token_usage || 0), 0),
      costs: interactions.reduce((sum, i) => sum + (i.cost_estimate || 0), 0),
      errors: interactions.filter(i => i.is_error).length,
      activeUsers: activeUsers.size,
      inputTokens: 0,
      outputTokens: 0
    };
    
    // Calculate input and output tokens separately
    (interactions as Interaction[]).forEach(interaction => {
      totalInputTokens += interaction.input_tokens || 0;
      totalOutputTokens += interaction.output_tokens || 0;
    });
    
    totalStats.inputTokens = totalInputTokens;
    totalStats.outputTokens = totalOutputTokens;
    
    // Prepare time series data
    const datesMap = new Map();
    
    (interactions as Interaction[]).forEach(interaction => {
      if (!interaction.interaction_time) return;
      
      const date = new Date(interaction.interaction_time).toISOString().split('T')[0];
      
      if (!datesMap.has(date)) {
        datesMap.set(date, {
          date,
          interactions: 0,
          tokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          costs: 0,
          activeUsers: new Set(),
          errors: 0
        });
      }
      
      const dayData = datesMap.get(date);
      dayData.interactions++;
      dayData.tokens += interaction.token_usage || 0;
      dayData.inputTokens += interaction.input_tokens || 0;
      dayData.outputTokens += interaction.output_tokens || 0;
      dayData.costs += interaction.cost_estimate || 0;
      
      if (interaction.user_id) {
        dayData.activeUsers.add(interaction.user_id);
      }
      
      if (interaction.is_error) {
        dayData.errors++;
      }
    });
    
    // Convert the map to an array and format the activeUsers set
    const timeSeriesData = Array.from(datesMap.values())
      .map(day => ({
        ...day,
        activeUsers: day.activeUsers.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Gather user-specific stats
    const userMap = new Map();
    
    (interactions as Interaction[]).forEach(interaction => {
      if (!interaction.user_id) return;
      
      if (!userMap.has(interaction.user_id)) {
        userMap.set(interaction.user_id, {
          userId: interaction.user_id,
          interactions: 0,
          tokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          costs: 0,
          lastActive: null
        });
      }
      
      const user = userMap.get(interaction.user_id);
      user.interactions++;
      user.tokens += interaction.token_usage || 0;
      user.inputTokens += interaction.input_tokens || 0;
      user.outputTokens += interaction.output_tokens || 0;
      user.costs += interaction.cost_estimate || 0;
      
      // Track most recent activity
      if (interaction.interaction_time) {
        const interactionTime = new Date(interaction.interaction_time).getTime();
        if (!user.lastActive || interactionTime > user.lastActive) {
          user.lastActive = interactionTime;
        }
      }
    });
    
    // Convert to array and fetch user details
    const userStats = [];
    
    // Convert Map entries to array to avoid MapIterator compatibility issues
    const userEntries = Array.from(userMap.entries());
    for (const [userId, stats] of userEntries) {
      // Get user details
      const { data: userData } = await supabase
        .schema('users')
        .from('users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();
      
      if (userData?.auth_user_id) {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(
            userData.auth_user_id
          );
          
          if (authData?.user) {
            stats.email = authData.user.email;
            stats.fullName = authData.user.user_metadata?.full_name;
          }
        } catch (e) {
          console.error('Error fetching auth data for user:', e);
        }
      }
      
      // Format last active as ISO string
      if (stats.lastActive) {
        stats.lastActive = new Date(stats.lastActive).toISOString();
      }
      
      userStats.push(stats);
    }
    
    // Sort user summaries by token usage
    userStats.sort((a, b) => b.tokens - a.tokens);
    
    return {
      totalStats,
      timeSeriesData,
      userStats
    };
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
  const supabase = await createClient();
  
  try {
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
        is_error
      `)
      .gte('interaction_time', oneHourAgo.toISOString())
      .lte('interaction_time', now.toISOString())
      .order('interaction_time', { ascending: false });
    
    if (error) throw error;
    
    // Get active users in the last hour
    const activeUserIds = new Set();
    recentInteractions?.forEach(interaction => {
      if (interaction.user_id) activeUserIds.add(interaction.user_id);
    });
    
    const hourlyMetrics = [];
    
    // Divide the last hour into 12 five-minute intervals
    for (let i = 0; i < 12; i++) {
      const intervalEnd = new Date(now.getTime() - i * 5 * 60 * 1000);
      const intervalStart = new Date(intervalEnd.getTime() - 5 * 60 * 1000);
      
      const intervalInteractions = recentInteractions?.filter(
        interaction => {
          if (!interaction.interaction_time) return false;
          const time = new Date(interaction.interaction_time).getTime();
          return time >= intervalStart.getTime() && time < intervalEnd.getTime();
        }
      ) || [];
      
      const tokens = intervalInteractions.reduce((sum, i) => sum + (i.token_usage || 0), 0);
      const errors = intervalInteractions.filter(i => i.is_error).length;
      
      // Calculate average response time (using a default value since response_time field doesn't exist yet)
      const avgLatency = intervalInteractions.length > 0 ? 
        200 : // Use a default value since response_time is not available
        0;
      
      hourlyMetrics.push({
        timestamp: intervalStart.toISOString(),
        requests: intervalInteractions.length,
        tokens,
        errors,
        avgLatency
      });
    }
    
    // Reverse to get chronological order
    hourlyMetrics.reverse();
    
    return {
      activeUsers: activeUserIds.size,
      totalRequests: recentInteractions?.length || 0,
      totalTokens: recentInteractions?.reduce((sum, i) => sum + (i.token_usage || 0), 0) || 0,
      errorRate: recentInteractions?.length ? 
        recentInteractions.filter(i => i.is_error).length / recentInteractions.length : 0,
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
 * Fetch user interactions for detailed user view
 */
export async function fetchUserInteractions(userId: string, limit: number = 50) {
  try {
    const supabase = await createClient();
    
    // Fetch the user's recent interactions
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
        assistants (name)
      `)
      .eq('user_id', userId)
      .order('interaction_time', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return interactions || [];
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    toast.error('Failed to load user interactions');
    return [];
  }
}

/**
 * Export dashboard data to CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  // Convert data to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map((row: any) => headers.map(header => {
      const value = row[header];
      // Handle special cases (null values, etc.)
      if (value === null || value === undefined) return '';
      
      // For objects, convert them to a simplified string representation
      // instead of using JSON.stringify which can be excessively verbose
      if (typeof value === 'object' && value !== null) {
        // Create a simplified representation based on object type
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        } else {
          // Create a simple key-value representation for objects
          const objStr = Object.entries(value)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          return `"${objStr}"`;
        }
      }
      
      // Escape quotes and wrap in quotes if contains commas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ];
  
  // Create and download CSV file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
