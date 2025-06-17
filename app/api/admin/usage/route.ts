import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { AuthContext } from '@/types/auth.types';
import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Force runtime rendering to prevent build-time Supabase initialization
export const runtime = 'nodejs';

/**
 * API route for fetching admin usage data
 */
export const GET = requireAdmin(async (context: AuthContext, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const assistantId = searchParams.get('assistantId') || undefined;

    const supabase = await createClient();

    // Calculate date filter based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build base query for interactions
    let baseQuery = supabase

      .from('interactions')
      .select(
        `
        id,
        token_usage,
        input_tokens,
        output_tokens,
        cost_estimate,
        is_error,
        user_id
      `
      )
      .gte('interaction_time', startDate.toISOString());

    // Apply assistant filter if provided
    if (assistantId) {
      baseQuery = baseQuery.eq('assistant_id', assistantId);
    }

    // Get total stats
    const { data: statsData, error: statsError } = await baseQuery;

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Calculate aggregated stats
    const uniqueUsers = new Set(statsData?.map(row => row.user_id).filter(Boolean) || []);
    const totalStats = {
      interactions: statsData?.length || 0,
      tokens: statsData?.reduce((sum: number, row) => sum + (row.token_usage || 0), 0) || 0,
      inputTokens: statsData?.reduce((sum: number, row) => sum + (row.input_tokens || 0), 0) || 0,
      outputTokens: statsData?.reduce((sum: number, row) => sum + (row.output_tokens || 0), 0) || 0,
      costs: statsData?.reduce((sum: number, row) => sum + (row.cost_estimate || 0), 0) || 0,
      errors: statsData?.filter(row => row.is_error).length || 0,
      activeUsers: uniqueUsers.size,
    };

    // Get time series data (daily aggregation)
    const { data: timeSeriesRaw, error: timeSeriesError } = await supabase

      .from('interactions')
      .select(
        `
        interaction_time,
        token_usage,
        input_tokens,
        output_tokens,
        cost_estimate,
        is_error,
        user_id
      `
      )
      .gte('interaction_time', startDate.toISOString())
      .order('interaction_time', { ascending: true });

    if (timeSeriesError) {
      console.error('Error fetching time series:', timeSeriesError);
      return NextResponse.json({ error: 'Failed to fetch time series data' }, { status: 500 });
    }

    // Group by date for time series
    const dailyData = new Map<
      string,
      {
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        errors: number;
        users: Set<string>;
      }
    >();

    timeSeriesRaw?.forEach(row => {
      const date = new Date(row.interaction_time || '').toISOString().split('T')[0];

      if (!dailyData.has(date)) {
        dailyData.set(date, {
          interactions: 0,
          tokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          costs: 0,
          errors: 0,
          users: new Set(),
        });
      }

      const dayData = dailyData.get(date)!;
      dayData.interactions += 1;
      dayData.tokens += row.token_usage || 0;
      dayData.inputTokens += row.input_tokens || 0;
      dayData.outputTokens += row.output_tokens || 0;
      dayData.costs += row.cost_estimate || 0;
      if (row.is_error) dayData.errors += 1;
      if (row.user_id) dayData.users.add(row.user_id);
    });

    const timeSeriesData = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      interactions: data.interactions,
      tokens: data.tokens,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      costs: data.costs,
      errors: data.errors,
      activeUsers: data.users.size,
    }));

    // Get user stats
    const { data: userStatsRaw, error: userStatsError } = await supabase

      .from('interactions')
      .select(
        `
        user_id,
        token_usage,
        input_tokens,
        output_tokens,
        cost_estimate,
        interaction_time
      `
      )
      .gte('interaction_time', startDate.toISOString())
      .not('user_id', 'is', null);

    if (userStatsError) {
      console.error('Error fetching user stats:', userStatsError);
      return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
    }

    // Get auth user data using admin API
    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
    }

    // Group user stats by user_id
    const userStatsMap = new Map<
      string,
      {
        interactions: number;
        tokens: number;
        inputTokens: number;
        outputTokens: number;
        costs: number;
        lastInteraction: string;
      }
    >();

    userStatsRaw?.forEach(row => {
      if (!row.user_id) return;

      if (!userStatsMap.has(row.user_id)) {
        userStatsMap.set(row.user_id, {
          interactions: 0,
          tokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          costs: 0,
          lastInteraction: row.interaction_time || '',
        });
      }

      const userStat = userStatsMap.get(row.user_id)!;
      userStat.interactions += 1;
      userStat.tokens += row.token_usage || 0;
      userStat.inputTokens += row.input_tokens || 0;
      userStat.outputTokens += row.output_tokens || 0;
      userStat.costs += row.cost_estimate || 0;

      // Keep the latest interaction time
      if (row.interaction_time && row.interaction_time > userStat.lastInteraction) {
        userStat.lastInteraction = row.interaction_time;
      }
    });

    // Create user stats array
    const userStats = Array.from(userStatsMap.entries()).map(([userId, stats]) => {
      const authUser = authUsersData?.users?.find(u => u.id === userId);
      const userMetadata = authUser?.user_metadata as
        | { full_name?: string; name?: string }
        | undefined;

      return {
        userId,
        email: authUser?.email,
        fullName: userMetadata?.full_name || userMetadata?.name,
        interactions: stats.interactions,
        tokens: stats.tokens,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        costs: stats.costs,
        lastActive: stats.lastInteraction, // Use last interaction time since we don't have users table
      };
    });

    return NextResponse.json({
      totalStats,
      timeSeriesData,
      userStats,
    });
  } catch (error) {
    console.error('Error in admin usage API:', error);

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
