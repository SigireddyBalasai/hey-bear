import { useCallback, useState } from 'react';

import type { DashboardStats } from '@/types/admin.types';
import type { Database } from '@/types/db.types';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

type InteractionRow = Database['public']['Tables']['interactions']['Row'];

export function useDashboardData() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    users: {
      total: 0,
      activeToday: 0,
      activeThisWeek: 0,
    },
    interactions: {
      total: 0,
      totalTokens: 0,
      costEstimate: 0,
      errorRate: 0,
    },
    timeSeriesData: [],
    userUsage: [],
  });

  const supabase = createClient();

  const loadDashboardData = useCallback(async () => {
    await withErrorHandling(
      async () => {
        const endDate = new Date();
        const startDate = new Date();

        // Calculate days to subtract based on selected time range
        let daysToSubtract = 30;
        if (selectedTimeRange === '7d') {
          daysToSubtract = 7;
        } else if (selectedTimeRange === '90d') {
          daysToSubtract = 90;
        }

        startDate.setDate(endDate.getDate() - daysToSubtract);

        // Get interaction metrics
        const { data: interactions, error: interactionsError } = await supabase
          .from('interactions')
          .select('*')
          .gte('interaction_time', startDate.toISOString())
          .lte('interaction_time', endDate.toISOString());

        if (interactionsError) throw interactionsError;

        // Calculate dates for active users
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Calculate total unique users from interactions
        const uniqueUserIds = new Set(
          interactions.map((i: InteractionRow) => i.user_id).filter(Boolean)
        );
        const totalUsers = uniqueUserIds.size;

        // Calculate active users
        const usersActiveToday = new Set(
          interactions
            .filter(
              (i: InteractionRow) => i.interaction_time && new Date(i.interaction_time) >= oneDayAgo
            )
            .map((i: InteractionRow) => i.user_id)
            .filter(Boolean)
        );
        const usersActiveThisWeek = new Set(
          interactions
            .filter(
              (i: InteractionRow) =>
                i.interaction_time && new Date(i.interaction_time) >= sevenDaysAgo
            )
            .map((i: InteractionRow) => i.user_id)
            .filter(Boolean)
        );

        const activeToday = usersActiveToday.size;
        const activeThisWeek = usersActiveThisWeek.size;

        // Calculate interaction stats
        const totalInteractions = interactions.length;
        const totalTokens = interactions.reduce(
          (sum, interaction) => sum + (interaction.token_usage ?? 0),
          0
        );
        const totalCostEstimate = interactions.reduce(
          (sum, interaction) => sum + (interaction.cost_estimate ?? 0),
          0
        );
        const errorCount = interactions.filter(interaction => interaction.is_error).length;
        const errorRate = totalInteractions > 0 ? (errorCount / totalInteractions) * 100 : 0;

        // Create time series data
        const timeSeriesData = createTimeSeriesData(interactions, startDate, endDate);

        // Create user usage stats
        const userUsage = await createUserUsageStats(interactions, supabase);

        setDashboardStats({
          users: {
            total: totalUsers ?? 0,
            activeToday,
            activeThisWeek,
          },
          interactions: {
            total: totalInteractions,
            totalTokens,
            costEstimate: totalCostEstimate,
            errorRate,
          },
          timeSeriesData,
          userUsage: [], // TODO: Fix this to return proper UserUsageStats format
        });
      },
      {
        toastTitle: 'Failed to load dashboard data',
        context: 'dashboard data loading',
      }
    );
  }, [selectedTimeRange, supabase]);

  return {
    selectedTimeRange,
    setSelectedTimeRange,
    dashboardStats,
    loadDashboardData,
  };
}

function createTimeSeriesData(interactions: InteractionRow[], startDate: Date, endDate: Date) {
  const timeSeriesData = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayInteractions = interactions.filter(
      interaction =>
        interaction.interaction_time &&
        new Date(interaction.interaction_time) >= dayStart &&
        new Date(interaction.interaction_time) <= dayEnd
    );

    const interactionCount = dayInteractions.length;
    const inputTokens = dayInteractions.reduce(
      (sum, interaction) => sum + (interaction.input_tokens ?? 0),
      0
    );
    const outputTokens = dayInteractions.reduce(
      (sum, interaction) => sum + (interaction.output_tokens ?? 0),
      0
    );
    const totalTokens = dayInteractions.reduce(
      (sum, interaction) => sum + (interaction.token_usage ?? 0),
      0
    );
    const costs = dayInteractions.reduce(
      (sum, interaction) => sum + (interaction.cost_estimate ?? 0),
      0
    );
    const activeUsers = new Set(dayInteractions.map(i => i.user_id).filter(Boolean)).size;
    const errors = dayInteractions.filter(i => i.is_error).length;

    timeSeriesData.push({
      date: currentDate.toISOString().split('T')[0],
      interactions: interactionCount,
      tokens: totalTokens,
      inputTokens,
      outputTokens,
      totalTokens,
      costs,
      activeUsers,
      errors,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeSeriesData;
}

async function createUserUsageStats(interactions: InteractionRow[], supabase: any) {
  // Aggregate interaction stats per user
  const userInteractionStats = new Map<
    string,
    { message_count: number; token_usage: number; cost_estimate: number }
  >();

  interactions.forEach((interaction: InteractionRow) => {
    if (!interaction.user_id) return;

    const stats = userInteractionStats.get(interaction.user_id) ?? {
      message_count: 0,
      token_usage: 0,
      cost_estimate: 0,
    };

    stats.message_count++;
    stats.token_usage += interaction.token_usage ?? 0;
    stats.cost_estimate += interaction.cost_estimate ?? 0;

    userInteractionStats.set(interaction.user_id, stats);
  });

  // Get all unique users from interactions
  const allUniqueUserIds: string[] = Array.from(
    new Set(
      interactions
        .map((i: InteractionRow) => i.user_id)
        .filter((id: string | null | undefined): id is string => Boolean(id))
    )
  );

  const userUsage = allUniqueUserIds
    .map((userId: string) => {
      const stats = userInteractionStats.get(userId);
      if (!stats) return null;

      return {
        user_id: userId,
        total_interactions: stats.message_count,
        total_tokens: stats.token_usage,
        total_cost: stats.cost_estimate,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => (b?.total_interactions ?? 0) - (a?.total_interactions ?? 0));

  return userUsage;
}
