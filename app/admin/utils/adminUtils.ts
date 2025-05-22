import { toast } from 'sonner';

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

interface UserStat {
  userId: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  lastActive: string | null;
  email?: string;
  fullName?: string;
}

interface HourlyMetric {
  timestamp: string;
  requests: number;
  tokens: number;
  errors: number;
  avgLatency: number;
}

// Mock data generation helper functions
const generateTimeSeriesData = (days: number): TimeSeriesItem[] => {
  const data: TimeSeriesItem[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      interactions: Math.floor(Math.random() * 100) + 20,
      tokens: Math.floor(Math.random() * 10000) + 1000,
      inputTokens: Math.floor(Math.random() * 3000) + 300,
      outputTokens: Math.floor(Math.random() * 7000) + 700,
      costs: Number((Math.random() * 10 + 1).toFixed(2)),
      activeUsers: Math.floor(Math.random() * 10) + 5,
      errors: Math.floor(Math.random() * 3)
    });
  }
  
  return data;
};

const generateUserStats = (count: number): UserStat[] => {
  const stats: UserStat[] = [];
  
  for (let i = 0; i < count; i++) {
    stats.push({
      userId: `user-${i + 1}`,
      interactions: Math.floor(Math.random() * 1000) + 100,
      tokens: Math.floor(Math.random() * 100000) + 10000,
      inputTokens: Math.floor(Math.random() * 30000) + 3000,
      outputTokens: Math.floor(Math.random() * 70000) + 7000,
      costs: Number((Math.random() * 100 + 10).toFixed(2)),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      email: `user${i + 1}@example.com`,
      fullName: `User ${i + 1}`
    });
  }
  
  return stats.sort((a, b) => b.tokens - a.tokens);
};

/**
 * Fetch all users with usage information
 */
export async function fetchAllUsers() {
  try {
    const users = Array.from({ length: 50 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      full_name: `User ${i + 1}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_sign_in: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      plan: {
        name: ['Free', 'Pro', 'Enterprise'][Math.floor(Math.random() * 3)],
        description: 'Plan description',
        max_assistants: Math.floor(Math.random() * 5) + 1,
        max_interactions: Math.floor(Math.random() * 1000) + 100
      },
      userusage: {
        interactions_used: Math.floor(Math.random() * 1000) + 100,
        assistants_used: Math.floor(Math.random() * 5) + 1,
        token_usage: Math.floor(Math.random() * 100000) + 10000,
        cost_estimate: Number((Math.random() * 100 + 10).toFixed(2))
      }
    }));
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
    return [];
  }
}

/**
 * Fetch aggregated usage data for dashboard
 */
export async function fetchUsageData(timeframe: string = '30d', _assistantId: string = 'all', plan: string = 'all') {
  try {
    let days = 30;
    switch (timeframe) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '180d': days = 180; break;
    }
    
    const timeSeriesData = generateTimeSeriesData(days);
    let userStats = generateUserStats(20);

    // Filter by plan if specified
    if (plan !== 'all') {
      userStats = userStats.filter(_user => {
        // Mock the plan assignment - in real implementation this would come from the database
        const userPlan = ['personal', 'business', 'enterprise'][Math.floor(Math.random() * 3)];
        return userPlan === plan;
      });
    }
    
    // Calculate total stats from time series data and filtered users
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
    const hourlyMetrics: HourlyMetric[] = [];
    const now = new Date();
    
    // Generate 12 five-minute intervals of data
    for (let i = 11; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000).toISOString();
      hourlyMetrics.push({
        timestamp,
        requests: Math.floor(Math.random() * 50) + 10,
        tokens: Math.floor(Math.random() * 5000) + 500,
        errors: Math.floor(Math.random() * 2),
        avgLatency: Math.floor(Math.random() * 150) + 50
      });
    }
    
    return {
      activeUsers: Math.floor(Math.random() * 20) + 10,
      totalRequests: hourlyMetrics.reduce((sum, m) => sum + m.requests, 0),
      totalTokens: hourlyMetrics.reduce((sum, m) => sum + m.tokens, 0),
      errorRate: hourlyMetrics.reduce((sum, m) => sum + m.errors, 0) / hourlyMetrics.reduce((sum, m) => sum + m.requests, 0),
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
    const interactions = Array.from({ length: limit }, (_, i) => ({
      id: `interaction-${i + 1}`,
      interaction_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      input_tokens: Math.floor(Math.random() * 300) + 50,
      output_tokens: Math.floor(Math.random() * 700) + 100,
      token_usage: Math.floor(Math.random() * 1000) + 150,
      cost_estimate: Number((Math.random() * 1 + 0.1).toFixed(3)),
      is_error: Math.random() < 0.05,
      assistant_id: `assistant-${Math.floor(Math.random() * 5) + 1}`,
      assistants: {
        name: `Assistant ${Math.floor(Math.random() * 5) + 1}`
      }
    }));
    
    return interactions;
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    toast.error('Failed to load user interactions');
    return [];
  }
}
