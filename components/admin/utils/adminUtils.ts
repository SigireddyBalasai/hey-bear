type UserWithUsage = {
  id: string;
  auth_user_id: string;
  email?: string;
  full_name?: string;
  last_sign_in?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
  stripe_customer_id?: string | null;
  plan?: {
    id: string;
    name: string;
  };
  userusage?: {
    interactions_used: number;
    assistants_used: number;
    token_usage: number;
    cost_estimate: number;
  };
};

/**
 * Fetches usage data for the admin dashboard via API
 */
export async function fetchUsageData(
  timeframe?: string,
  assistantId?: string,
  plan?: string
): Promise<{
  totalStats: {
    interactions: number;
    tokens: number;
    costs: number;
    errors: number;
    activeUsers: number;
    inputTokens: number;
    outputTokens: number;
  };
  timeSeriesData: Array<{
    date: string;
    interactions: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    costs: number;
    activeUsers: number;
    errors: number;
  }>;
  userStats: Array<{
    userId: string;
    email?: string;
    fullName?: string;
    interactions: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    costs: number;
    lastActive: string | null;
  }>;
}> {
  try {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (assistantId) params.append('assistantId', assistantId);
    if (plan) params.append('plan', plan);

    const response = await fetch(`/api/admin/usage?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch usage data: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      totalStats: {
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        errors: number;
        activeUsers: number;
      };
      timeSeriesData: Array<{
        date: string;
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        activeUsers: number;
        errors: number;
      }>;
      userStats: Array<{
        userId: string;
        email?: string;
        fullName?: string;
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        lastActive: string | null;
      }>;
    };
    return data;
  } catch (error) {
    console.error('Error in fetchUsageData:', error);
    // Return empty data on error
    return {
      totalStats: {
        interactions: 0,
        tokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        costs: 0,
        errors: 0,
        activeUsers: 0,
      },
      timeSeriesData: [],
      userStats: [],
    };
  }
}

/**
 * Fetches all users with their usage data via API
 */
export async function fetchAllUsers(): Promise<UserWithUsage[]> {
  try {
    const response = await fetch('/api/admin/users');

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = (await response.json()) as UserWithUsage[];
    return data;
  } catch (error) {
    console.error('Error in fetchAllUsers:', error);
    return [];
  }
}

/**
 * Fetches system metrics for real-time monitoring via API
 */
export async function fetchSystemMetrics(): Promise<{
  activeUsers: number;
  totalRequests: number;
  totalTokens: number;
  errorRate: number;
  hourlyMetrics: Array<{
    timestamp: string;
    requests: number;
    tokens: number;
    errors: number;
    avgLatency: number;
  }>;
}> {
  try {
    const response = await fetch('/api/admin/metrics');

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      activeUsers: number;
      totalRequests: number;
      totalTokens: number;
      errorRate: number;
      hourlyMetrics: Array<{
        timestamp: string;
        requests: number;
        tokens: number;
        errors: number;
        avgLatency: number;
      }>;
    };
    return data;
  } catch (error) {
    console.error('Error in fetchSystemMetrics:', error);
    // Return empty data on error
    return {
      activeUsers: 0,
      totalRequests: 0,
      totalTokens: 0,
      errorRate: 0,
      hourlyMetrics: [],
    };
  }
}
