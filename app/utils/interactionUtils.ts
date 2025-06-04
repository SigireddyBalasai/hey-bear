import type { Database, Tables } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';

type Interaction = Tables<'interactions'>;
type InteractionInsert = Database['public']['Tables']['interactions']['Insert'];

export async function getInteractions(
  assistantId?: string,
  userId?: string,
  limit: number = 100
): Promise<Interaction[]> {
  try {
    const supabase = await createClient();
    let query = supabase

      .from('interactions')
      .select('*')
      .order('interaction_time', { ascending: false })
      .limit(limit);

    if (assistantId) {
      query = query.eq('assistant_id', assistantId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching interactions:', {
        message: error.message || 'Unknown error',
        code: error.code || 'No code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        stack: error.stack || 'No stack trace',
      });
      throw error;
    }

    return data;
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error in getInteractions:', {
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack || 'No stack trace',
      error: error,
    });
    throw error;
  }
}

export async function getInteractionStats(assistantId: string): Promise<{
  total: number;
  errorCount: number;
  avgResponseTime: number;
  totalTokens: number;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase

      .from('interactions')
      .select('duration, is_error, token_usage')
      .eq('assistant_id', assistantId);

    if (error) {
      console.error('Error fetching interaction stats:', error);
      throw error;
    }

    const stats = data.reduce(
      (acc, curr) => ({
        total: acc.total + 1,
        errorCount: acc.errorCount + (curr.is_error ? 1 : 0),
        totalDuration: acc.totalDuration + (curr.duration ?? 0),
        totalTokens: acc.totalTokens + (curr.token_usage ?? 0),
      }),
      { total: 0, errorCount: 0, totalDuration: 0, totalTokens: 0 }
    );

    return {
      total: stats.total,
      errorCount: stats.errorCount,
      avgResponseTime: stats.total ? stats.totalDuration / stats.total : 0,
      totalTokens: stats.totalTokens,
    };
  } catch (error) {
    console.error('Error in getInteractionStats:', error);
    throw error;
  }
}

export async function recordInteraction(
  authUserId: string, // Changed from userId to authUserId to reflect it's from auth.getUser()
  assistantId: string,
  chat: string | null, // More specific type instead of any
  userRequest: string,
  response: string,
  tokenUsage: number,
  costEstimate: number,
  duration: number,
  isError: boolean
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get the application user ID from the auth user ID
    const { data: appUser, error: appUserError } = await supabase

      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (appUserError) {
      console.error('Error fetching application user ID for interaction:', appUserError);
      return false;
    }

    const interactionData: InteractionInsert = {
      user_id: appUser.id, // Use the application user ID
      assistant_id: assistantId,
      chat: chat,
      request: userRequest, // Required field
      response: response, // Required field
      token_usage: tokenUsage,
      cost_estimate: costEstimate,
      duration: duration,
      is_error: isError,
      interaction_time: new Date().toISOString(),
      // monthly_period can be derived or set here if needed, similar to logTwilioInteraction
    };

    const { error: insertError } = await supabase.from('interactions').insert(interactionData);

    if (insertError) {
      console.error('Error recording interaction:', insertError);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in recordInteraction:', error);
    return false;
  }
}

export async function deleteInteraction(interactionId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('interactions').delete().eq('id', interactionId);

    if (error) {
      console.error('Error deleting interaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteInteraction:', error);
    throw error;
  }
}
