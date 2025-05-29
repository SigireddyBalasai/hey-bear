// For stub implementations we're not using these, but they'll be needed for full implementation
import type { Database } from '@/lib/db.types';

// Define proper types from database schema
type UserRecord = Database['users']['Tables']['users']['Row'];
// Prefix with _ to avoid unused variable warnings
type _InteractionRecord = Database['analytics']['Tables']['interactions']['Row'];

// Type definitions for return values
export interface ExtendedUser extends UserRecord {
  email?: string;
  full_name?: string;
  last_sign_in?: string;
  plan?: {
    id: string;
    name: string;
    description: string;
    max_assistants: number;
    max_interactions: number;
  };
  userusage?: {
    interactions_used: number;
    assistants_used: number;
    token_usage: number;
    cost_estimate: number;
  };
}

// Define result types for better type safety
export interface UsageStats {
  interactions: number;
  tokens: number;
  costs: number;
  errors: number;
  activeUsers: number;
  inputTokens: number;
  outputTokens: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  activeUsers: number;
  errors: number;
}

// Define user statistics type
export interface UserStat {
  userId: string;
  email?: string;
  fullName?: string;
  interactions: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costs: number;
  lastActive: string | null;
}

// Define usage data result type
export interface UsageDataResult {
  totalStats: UsageStats;
  timeSeriesData: TimeSeriesDataPoint[];
  userStats: UserStat[];
}

// Define system metrics result type
export interface SystemMetricsResult {
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
}

// Define type for interaction results with assistant data
export interface UserInteraction extends _InteractionRecord {
  assistants?: { name: string | null };
}

/**
 * Fetches usage data for the admin dashboard
 */
export async function fetchUsageData(
  startDate?: string,
  endDate?: string
): Promise<UsageDataResult> {
  // This is a stub implementation
  console.log('Fetching usage data for date range:', { startDate, endDate });

  // Return mock data
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

/**
 * Fetches all users with their usage data
 */
export async function fetchAllUsers(): Promise<ExtendedUser[]> {
  // This is a stub implementation
  console.log('Fetching all users');

  // Return empty array for now
  return [];
}

/**
 * Fetches system metrics for real-time monitoring
 */
export async function fetchSystemMetrics(): Promise<SystemMetricsResult> {
  // This is a stub implementation
  console.log('Fetching system metrics');

  // Return mock data
  return {
    activeUsers: 0,
    totalRequests: 0,
    totalTokens: 0,
    errorRate: 0,
    hourlyMetrics: [],
  };
}
