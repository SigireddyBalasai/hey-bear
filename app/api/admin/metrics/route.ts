'use cache';

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server-admin';

// Cached function to fetch 24h interactions data
async function fetch24hInteractions() {
  'use cache';

  const supabase = await createClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .gte('interaction_time', twentyFourHoursAgo.toISOString())
    .order('interaction_time', { ascending: true });

  if (error) {
    console.error('Error fetching 24h metrics:', error);
    throw new Error('Failed to fetch metrics');
  }

  return data ?? [];
}

// Cached function to fetch active users in the last hour
async function fetchActiveUsers() {
  'use cache';

  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .gte('interaction_time', oneHourAgo.toISOString())
    .not('user_id', 'is', null);

  if (error) {
    console.error('Error fetching active users:', error);

    return [];
  }

  return data ?? [];
}

/**
 * API route for fetching system metrics for real-time monitoring
 */
export const GET = requireAdmin(async () => {
  try {
    const now = new Date();

    // Use cached functions to reduce database load
    const [last24hData, activeUsersData] = await Promise.all([
      fetch24hInteractions(),
      fetchActiveUsers(),
    ]);

    const uniqueActiveUsers = new Set(activeUsersData.map(row => row.user_id).filter(Boolean));

    // Calculate basic metrics
    const totalRequests = last24hData.length;
    const totalTokens = last24hData.reduce((sum, row) => sum + (row.token_usage ?? 0), 0);
    const totalErrors = last24hData.filter(row => row.is_error).length;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Generate hourly metrics for the last 24 hours
    const hourlyMetrics = [];

    // Create 24 hourly buckets
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourData = last24hData.filter(row => {
        const interactionTime = new Date(row.interaction_time ?? '');

        return interactionTime >= hourStart && interactionTime < hourEnd;
      });

      const hourRequests = hourData.length;
      const hourTokens = hourData.reduce((sum, row) => sum + (row.token_usage ?? 0), 0);
      const hourErrors = hourData.filter(row => row.is_error).length;
      const durations = hourData
        .map(row => row.duration)
        .filter((duration): duration is number => duration !== null && duration !== undefined);
      const avgLatency =
        durations.length > 0
          ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
          : 0;

      hourlyMetrics.push({
        timestamp: hourStart.toISOString(),
        requests: hourRequests,
        tokens: hourTokens,
        errors: hourErrors,
        avgLatency: Math.round(avgLatency),
      });
    }

    return NextResponse.json({
      activeUsers: uniqueActiveUsers.size,
      totalRequests,
      totalTokens,
      errorRate: Math.round(errorRate * 100) / 100, // Round to 2 decimal places
      hourlyMetrics,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden - Admin access required') {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
