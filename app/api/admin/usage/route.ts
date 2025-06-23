'use cache';

import { NextResponse } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db.types';
import type { UsageAnalytics, UsageOverview, UserUsageStats } from '@/types/usage.types';
import { requireAdmin } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server-admin';

type Interaction = Database['public']['Tables']['interactions']['Row'];
type Assistant = Database['public']['Tables']['assistants']['Row'];

// Cached function to fetch all interactions data
async function fetchAllInteractions(): Promise<Interaction[]> {
  'use cache';

  const supabase: SupabaseClient<Database> = await createClient();

  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .order('interaction_time', { ascending: false });

  if (error) {
    console.error('Error fetching interactions:', error);
    throw new Error('Failed to fetch interactions data');
  }

  return data ?? [];
}

// Cached function to fetch all assistants data
async function fetchAllAssistants(): Promise<Assistant[]> {
  'use cache';

  const supabase: SupabaseClient<Database> = await createClient();

  const { data, error } = await supabase.from('assistants').select('*');

  if (error) {
    console.error('Error fetching assistants:', error);
    throw new Error('Failed to fetch assistants data');
  }

  return data ?? [];
}

// Cached function to get unique user count
async function fetchTotalUsers(): Promise<number> {
  'use cache';

  const supabase: SupabaseClient<Database> = await createClient();

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error fetching user count:', error);

    return 0;
  }

  return data?.users?.length ?? 0;
}

// Process usage analytics from raw data
function processUsageAnalytics(
  interactions: Interaction[],
  assistants: Assistant[],
  totalUsers: number
): UsageAnalytics {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter interactions for time periods
  const interactions24h = interactions.filter(
    i => i.interaction_time && new Date(i.interaction_time) >= twentyFourHoursAgo
  );
  const interactions7d = interactions.filter(
    i => i.interaction_time && new Date(i.interaction_time) >= sevenDaysAgo
  );
  const interactions30d = interactions.filter(
    i => i.interaction_time && new Date(i.interaction_time) >= thirtyDaysAgo
  );

  // Calculate user stats
  const userStatsMap = new Map<string, UserUsageStats>();

  for (const interaction of interactions) {
    if (!interaction.user_id) continue;

    const existing = userStatsMap.get(interaction.user_id) ?? {
      user_id: interaction.user_id,
      interactions_count: 0,
      token_usage: 0,
      cost_estimate: 0,
      assistants_count: 0,
      first_interaction: null,
      last_interaction: null,
    };

    existing.interactions_count++;
    existing.token_usage += interaction.token_usage ?? 0;
    existing.cost_estimate += interaction.cost_estimate ?? 0;

    if (interaction.interaction_time) {
      if (
        !existing.first_interaction ||
        interaction.interaction_time < existing.first_interaction
      ) {
        existing.first_interaction = interaction.interaction_time;
      }
      if (
        !existing.last_interaction ||
        (interaction.interaction_time && interaction.interaction_time > existing.last_interaction)
      ) {
        existing.last_interaction = interaction.interaction_time;
      }
    }

    userStatsMap.set(interaction.user_id, existing);
  }

  // Add assistant counts to user stats
  for (const assistant of assistants) {
    if (!assistant.user_id) continue;

    const existing = userStatsMap.get(assistant.user_id);

    if (existing) {
      existing.assistants_count++;
    } else {
      userStatsMap.set(assistant.user_id, {
        user_id: assistant.user_id,
        interactions_count: 0,
        token_usage: 0,
        cost_estimate: 0,
        assistants_count: 1,
        first_interaction: null,
        last_interaction: null,
      });
    }
  }

  const userStats = [...userStatsMap.values()];

  // Calculate overview
  const overview: UsageOverview = {
    total_users: totalUsers,
    total_interactions: interactions.length,
    total_tokens: interactions.reduce((sum, i) => sum + (i.token_usage ?? 0), 0),
    total_cost: interactions.reduce((sum, i) => sum + (i.cost_estimate ?? 0), 0),
    total_assistants: assistants.length,
    active_users_24h: new Set(interactions24h.map(i => i.user_id).filter(Boolean)).size,
    active_users_7d: new Set(interactions7d.map(i => i.user_id).filter(Boolean)).size,
    avg_interactions_per_user: totalUsers > 0 ? interactions.length / totalUsers : 0,
    avg_tokens_per_interaction:
      interactions.length > 0
        ? interactions.reduce((sum, i) => sum + (i.token_usage ?? 0), 0) / interactions.length
        : 0,
  };

  // Calculate daily stats for the last 30 days
  const dailyStatsMap = new Map<
    string,
    {
      date: string;
      interactions: number;
      tokens: number;
      cost: number;
      users: Set<string>;
    }
  >();

  // Initialize all days in the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const [dateKey] = date.toISOString().split('T');

    dailyStatsMap.set(dateKey, {
      date: dateKey,
      interactions: 0,
      tokens: 0,
      cost: 0,
      users: new Set(),
    });
  }

  // Populate daily stats from interactions
  for (const interaction of interactions30d) {
    if (!interaction.interaction_time) continue;

    const [dateKey] = interaction.interaction_time.split('T');
    const dailyStat = dailyStatsMap.get(dateKey);

    if (dailyStat) {
      dailyStat.interactions++;
      dailyStat.tokens += interaction.token_usage ?? 0;
      dailyStat.cost += interaction.cost_estimate ?? 0;
      if (interaction.user_id) {
        dailyStat.users.add(interaction.user_id);
      }
    }
  }

  const dailyStats = [...dailyStatsMap.values()]
    .map(stat => ({
      date: stat.date,
      interactions: stat.interactions,
      tokens: stat.tokens,
      cost: stat.cost,
      unique_users: stat.users.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get top users by interactions
  const topUsers = userStats
    .sort((a, b) => b.interactions_count - a.interactions_count)
    .slice(0, 10);

  return {
    overview,
    user_stats: userStats,
    daily_stats: dailyStats,
    top_users: topUsers,
  };
}

/**
 * GET /api/admin/usage
 *
 * Returns comprehensive usage analytics for admin dashboard
 */
export const GET = requireAdmin(
  async (): Promise<NextResponse<UsageAnalytics | { error: string }>> => {
    try {
      // Fetch all data using cached functions
      const [interactions, assistants, totalUsers] = await Promise.all([
        fetchAllInteractions(),
        fetchAllAssistants(),
        fetchTotalUsers(),
      ]);

      // Process the analytics
      const analytics = processUsageAnalytics(interactions, assistants, totalUsers);

      return NextResponse.json(analytics);
    } catch (error: unknown) {
      console.error('Error in admin usage API:', error);

      return NextResponse.json({ error: 'Failed to fetch usage analytics' }, { status: 500 });
    }
  }
);
