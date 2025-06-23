import type { AdminUserWithUsage } from '@/types/admin.types';

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
  timeSeriesData: {
    date: string;
    interactions: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    costs: number;
    activeUsers: number;
    errors: number;
  }[];
  userStats: {
    userId: string;
    email?: string;
    fullName?: string;
    interactions: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    costs: number;
    lastActive: string | null;
  }[];
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

    return (await response.json()) as {
      totalStats: {
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        errors: number;
        activeUsers: number;
      };
      timeSeriesData: {
        date: string;
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        activeUsers: number;
        errors: number;
      }[];
      userStats: {
        userId: string;
        email?: string;
        fullName?: string;
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        lastActive: string | null;
      }[];
    };
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
export async function fetchAllUsers(): Promise<AdminUserWithUsage[]> {
  try {
    const response = await fetch('/api/admin/users');

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return (await response.json()) as AdminUserWithUsage[];
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
  hourlyMetrics: {
    timestamp: string;
    requests: number;
    tokens: number;
    errors: number;
    avgLatency: number;
  }[];
}> {
  try {
    const response = await fetch('/api/admin/metrics');

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    return (await response.json()) as {
      activeUsers: number;
      totalRequests: number;
      totalTokens: number;
      errorRate: number;
      hourlyMetrics: {
        timestamp: string;
        requests: number;
        tokens: number;
        errors: number;
        avgLatency: number;
      }[];
    };
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
