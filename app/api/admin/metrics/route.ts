import { NextResponse } from 'next/server';

import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Force runtime rendering to prevent build-time Supabase initialization
export const runtime = 'nodejs';

/**
 * API route for fetching system metrics for real-time monitoring
 */
export const GET = requireAdmin(async () => {
  try {
    const supabase = await createClient();

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get all interactions from last 24 hours
    const { data: last24hData, error: last24hError } = await supabase
      .from('interactions')
      .select(
        `
        id,
        interaction_time,
        token_usage,
        is_error,
        user_id,
        duration
      `
      )
      .gte('interaction_time', twentyFourHoursAgo.toISOString())
      .order('interaction_time', { ascending: true });

    if (last24hError) {
      console.error('Error fetching 24h metrics:', last24hError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Get active users (users who had interactions in the last hour)
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('interactions')
      .select('user_id')
      .gte('interaction_time', oneHourAgo.toISOString())
      .not('user_id', 'is', null);

    if (activeUsersError) {
      console.error('Error fetching active users:', activeUsersError);
    }

    const uniqueActiveUsers = new Set(
      activeUsersData?.map(row => row.user_id).filter(Boolean) || []
    );

    // Calculate basic metrics
    const totalRequests = last24hData?.length || 0;
    const totalTokens = last24hData?.reduce((sum, row) => sum + (row.token_usage || 0), 0) || 0;
    const totalErrors = last24hData?.filter(row => row.is_error).length || 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Generate hourly metrics for the last 24 hours
    const hourlyMetrics = [];

    // Create 24 hourly buckets
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourData =
        last24hData?.filter(row => {
          const interactionTime = new Date(row.interaction_time || '');
          return interactionTime >= hourStart && interactionTime < hourEnd;
        }) || [];

      const hourRequests = hourData.length;
      const hourTokens = hourData.reduce((sum, row) => sum + (row.token_usage || 0), 0);
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
